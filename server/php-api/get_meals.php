<?php
/**
 * Liste des repas, avec leur disponibilité calculée depuis le stock.
 *
 *   GET get_meals.php
 *   -> [{ id, name, calories, image, ingredients,
 *         available, maxPortions, missing }]
 *
 * Disponibilité
 * -------------
 * Un repas est commandable si CHACUN de ses aliments est présent en stock
 * dans la quantité que la recette exige (repas_aliment.quantite_g).
 *
 * `maxPortions` est le nombre de portions réalisables : pour chaque aliment
 * on calcule stock / quantité requise, et on garde le plus petit. C'est
 * l'ingrédient le plus rare qui décide, comme en cuisine.
 *
 * Les lots périmés sont exclus du stock disponible.
 */

declare(strict_types=1);

require __DIR__ . '/db.php';

$config = loadConfig();
requireApiKey($config);
$pdo = connect($config);

try {
    $repas = $pdo
        ->query('SELECT id, nom_repas, `Catégorie`, image_repas FROM repas ORDER BY id')
        ->fetchAll();

    // quantite_g est indispensable : elle sert au calcul des calories
    // comme à celui de la disponibilité.
    $liaisons = $pdo
        ->query('SELECT repas_id, aliment_id, nom_aliment, quantite_g FROM repas_aliment')
        ->fetchAll();

    $aliments = $pdo
        ->query('SELECT id, nom, kcal_100g FROM aliment')
        ->fetchAll();

    // Stock réellement disponible par aliment, lots périmés exclus.
    // Un aliment peut avoir plusieurs lots : on les additionne.
    $stock = $pdo
        ->query('
            SELECT aliment_id, SUM(quantite_g) AS disponible
              FROM stock
             WHERE date_peremption IS NULL OR date_peremption >= CURDATE()
             GROUP BY aliment_id
        ')
        ->fetchAll();

    $kcalMap = [];
    foreach ($aliments as $a) {
        $kcalMap[$a['id']] = (float) $a['kcal_100g'];
    }

    $stockMap = [];
    foreach ($stock as $s) {
        $stockMap[$s['aliment_id']] = (float) $s['disponible'];
    }

    $ingredientsByRepas = [];
    $caloriesByRepas = [];
    $manquantsByRepas = [];
    $portionsByRepas = [];

    foreach ($liaisons as $l) {
        $rid = $l['repas_id'];
        $requis = (float) $l['quantite_g'];
        $disponible = $stockMap[$l['aliment_id']] ?? 0.0;

        if (!isset($ingredientsByRepas[$rid])) {
            $ingredientsByRepas[$rid] = [];
            $caloriesByRepas[$rid] = 0.0;
            $manquantsByRepas[$rid] = [];
            $portionsByRepas[$rid] = null;
        }

        $ingredientsByRepas[$rid][] = $l['nom_aliment'];

        // Calories réelles : kcal pour 100 g, ramenées à la quantité
        // effectivement présente dans la recette.
        $caloriesByRepas[$rid] +=
            (($kcalMap[$l['aliment_id']] ?? 0.0) * $requis) / 100;

        if ($requis <= 0) {
            continue; // quantité non renseignée : ne limite rien
        }

        if ($disponible < $requis) {
            $manquantsByRepas[$rid][] = [
                'name' => $l['nom_aliment'],
                'required' => round($requis, 1),
                'available' => round($disponible, 1),
            ];
        }

        $portions = (int) floor($disponible / $requis);
        if ($portionsByRepas[$rid] === null || $portions < $portionsByRepas[$rid]) {
            $portionsByRepas[$rid] = $portions;
        }
    }

    $result = [];
    foreach ($repas as $r) {
        $rid = $r['id'];

        $blob = $r['image_repas'];
        $image = '';
        if ($blob !== null && $blob !== '') {
            $image = 'data:image/jpeg;base64,' . base64_encode($blob);
        }

        // Un repas sans aliment déclaré : on ne peut rien affirmer sur son
        // stock, on le laisse commandable avec un nombre de portions inconnu.
        $portions = $portionsByRepas[$rid] ?? null;
        $manquants = $manquantsByRepas[$rid] ?? [];

        $result[] = [
            'id' => (string) $rid,
            'name' => $r['nom_repas'],
            'calories' => (int) round($caloriesByRepas[$rid] ?? 0),
            'image' => $image,
            'ingredients' => $ingredientsByRepas[$rid] ?? [],
            'categorie' => $r['Catégorie'] ?? 'repas',
            'available' => $manquants === [],
            'maxPortions' => $portions,
            'missing' => $manquants,
        ];
    }

    respond(200, ['data' => $result]);
} catch (PDOException $e) {
    respondPdoError($e);
} catch (Throwable $e) {
    error_log('NutriPass - get_meals : ' . $e->getMessage());
    respond(500, ['error' => 'Erreur serveur', 'detail' => $e->getMessage()]);
}
