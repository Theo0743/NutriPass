<?php
/**
 * Liste des repas, adaptée à la structure de la base.
 *
 *   GET get_meals.php  -> [{ id, name, calories, image, ingredients }]
 *
 * Reprend le socle db.php : clé API, connexion PDO, gestion d'erreurs.
 * image_repas est un MEDIUMBLOB : on l'encode en base64 data-uri.
 */

declare(strict_types=1);

require __DIR__ . '/db.php';

$config = loadConfig();
requireApiKey($config);
$pdo = connect($config);

try {
    $repas = $pdo
        ->query('SELECT id, nom_repas, image_repas FROM repas ORDER BY id')
        ->fetchAll();

    $liaisons = $pdo
        ->query('SELECT repas_id, nom_aliment, aliment_id FROM repas_aliment')
        ->fetchAll();

    $aliments = $pdo
        ->query('SELECT id, nom, kcal_100g FROM aliment')
        ->fetchAll();

    $kcalMap = [];
    foreach ($aliments as $a) {
        $kcalMap[$a['id']] = (float) $a['kcal_100g'];
    }

    $ingredientsByRepas = [];
    $caloriesByRepas = [];
    foreach ($liaisons as $l) {
        $rid = $l['repas_id'];
        if (!isset($ingredientsByRepas[$rid])) {
            $ingredientsByRepas[$rid] = [];
            $caloriesByRepas[$rid] = 0;
        }
        $ingredientsByRepas[$rid][] = $l['nom_aliment'];
        $caloriesByRepas[$rid] += $kcalMap[$l['aliment_id']] ?? 0;
    }

    $result = [];
    foreach ($repas as $r) {
        // image_repas est un BLOB binaire : on l'encode en data-uri base64.
        $blob = $r['image_repas'];
        $image = '';
        if ($blob !== null && $blob !== '') {
            $image = 'data:image/jpeg;base64,' . base64_encode($blob);
        }

        $result[] = [
            'id' => (string) $r['id'],
            'name' => $r['nom_repas'],
            'calories' => (int) round($caloriesByRepas[$r['id']] ?? 0),
            'image' => $image,
            'ingredients' => $ingredientsByRepas[$r['id']] ?? [],
        ];
    }

    respond(200, ['data' => $result]);
} catch (PDOException $e) {
    respondPdoError($e);
} catch (Throwable $e) {
    error_log('NutriPass - get_meals : ' . $e->getMessage());
    respond(500, ['error' => 'Erreur serveur', 'detail' => $e->getMessage()]);
}
