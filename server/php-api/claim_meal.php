<?php
/**
 * Enregistre une réclamation de repas et retire du stock ce qui est servi.
 *
 *   POST claim_meal.php
 *        { repas_id, meal_type, portion_size, astronaute_id, kcal }
 *
 * Les noms de l'astronaute et du repas ne sont PAS envoyés par l'application :
 * ils sont relus en base à partir des identifiants reçus. Deux raisons :
 *   - ils restent toujours cohérents avec les tables source, même si un nom
 *     est corrigé plus tard dans `astronaute` ou `repas` ;
 *   - un client ne peut pas enregistrer une identité fantaisiste.
 *
 * `astronaute_id` est facultatif : tant que le lecteur NFC n'est pas en place,
 * la borne doit rester utilisable, la réclamation est alors anonyme.
 *
 * Baisse du stock
 * ---------------
 * `kcal` est la valeur choisie avec le curseur, calculée pour la personne.
 * On en déduit combien de fois la recette est servie :
 *
 *     facteur = kcal choisies / kcal de la recette
 *
 * et on retire, pour chaque aliment, quantite_g (repas_aliment) × facteur.
 * Exemple : 1 820 kcal choisies sur une recette de 508 kcal -> facteur 3,58.
 *
 * Si `kcal` est absent, ou si la recette ne fait aucune calorie (l'eau), le
 * facteur vaut 1 : on retire une fois la recette.
 *
 * Le retrait se fait lot par lot, en commençant par le lot qui périme le plus
 * tôt, sans toucher aux lots périmés. Il n'y a volontairement aucun refus pour
 * stock insuffisant : l'application empêche déjà de commander un plat en
 * rupture. Le stock ne descend simplement jamais sous zéro.
 *
 * Le retrait et l'enregistrement de la réclamation forment une seule
 * transaction : soit les deux sont enregistrés, soit aucun.
 */

declare(strict_types=1);

require __DIR__ . '/db.php';

$config = loadConfig();
requireApiKey($config);
$pdo = connect($config);

$input = jsonBody();

$repas_id = isset($input['repas_id']) ? (int) $input['repas_id'] : null;
$meal_type = isset($input['meal_type']) ? (string) $input['meal_type'] : null;
$portion_size = isset($input['portion_size']) ? (int) $input['portion_size'] : null;
$astronaute_id = isset($input['astronaute_id']) && $input['astronaute_id'] !== ''
    ? (int) $input['astronaute_id']
    : null;
$kcal_choisies = isset($input['kcal']) && is_numeric($input['kcal'])
    ? (float) $input['kcal']
    : null;

if (!$repas_id || !$meal_type || !$portion_size) {
    respond(400, ['error' => 'Champs manquants']);
}

/** En dessous de ce seuil (en grammes), un reste à retirer est considéré nul. */
const EPSILON_G = 0.01;

try {
    // Création éventuelle de la table AVANT la transaction : une instruction
    // CREATE TABLE valide implicitement toute transaction en cours.
    $stmt = $pdo->query("SHOW TABLES LIKE 'reclamation'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("
            CREATE TABLE reclamation (
                id int(11) NOT NULL AUTO_INCREMENT,
                astronaute_id int(11) DEFAULT NULL,
                nom_astronaute varchar(100) DEFAULT NULL,
                prenom_astronaute varchar(100) DEFAULT NULL,
                repas_id int(11) DEFAULT NULL,
                nom_repas varchar(255) DEFAULT NULL,
                meal_type varchar(50) NOT NULL,
                portion_size int(11) NOT NULL,
                date_reclamation datetime NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                FOREIGN KEY (repas_id) REFERENCES repas(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        ");
    }

    // Nom du repas, relu depuis la table repas.
    $nom_repas = null;
    $stmt = $pdo->prepare('SELECT nom_repas FROM repas WHERE id = ? LIMIT 1');
    $stmt->execute([$repas_id]);
    $ligne = $stmt->fetch();
    if ($ligne !== false) {
        $nom_repas = $ligne['nom_repas'];
    }

    // Identité de l'astronaute, relue depuis la table astronaute. Fait avant
    // la transaction : un 404 ici ne laisse aucune opération à moitié faite.
    $nom_astronaute = null;
    $prenom_astronaute = null;
    if ($astronaute_id !== null) {
        $stmt = $pdo->prepare('SELECT nom, prenom FROM astronaute WHERE id = ? LIMIT 1');
        $stmt->execute([$astronaute_id]);
        $ligne = $stmt->fetch();
        if ($ligne === false) {
            respond(404, ['error' => 'Astronaute introuvable : ' . $astronaute_id]);
        }
        $nom_astronaute = $ligne['nom'];
        $prenom_astronaute = $ligne['prenom'];
    }

    // Composition de la recette. Un aliment présent deux fois dans la même
    // recette est regroupé en une seule ligne.
    $stmt = $pdo->prepare('
        SELECT ra.aliment_id,
               MAX(ra.nom_aliment)             AS nom_aliment,
               SUM(ra.quantite_g)              AS quantite_g,
               COALESCE(MAX(a.kcal_100g), 0)   AS kcal_100g
          FROM repas_aliment ra
          LEFT JOIN aliment a ON a.id = ra.aliment_id
         WHERE ra.repas_id = ?
         GROUP BY ra.aliment_id
    ');
    $stmt->execute([$repas_id]);
    $recette = $stmt->fetchAll();

    $kcal_recette = 0.0;
    foreach ($recette as $r) {
        $kcal_recette += ((float) $r['kcal_100g'] * (float) $r['quantite_g']) / 100;
    }

    $facteur = ($kcal_choisies !== null && $kcal_choisies > 0 && $kcal_recette > 0)
        ? $kcal_choisies / $kcal_recette
        : 1.0;

    $pdo->beginTransaction();

    // Lots encore consommables d'un aliment, du plus proche de la péremption au
    // plus lointain ; les lots sans date passent en dernier. FOR UPDATE bloque
    // ces lignes jusqu'à la fin de la transaction : deux commandes simultanées
    // ne peuvent pas retirer le même stock.
    $lots = $pdo->prepare('
        SELECT id, quantite_g
          FROM stock
         WHERE aliment_id = ?
           AND quantite_g > 0
           AND (date_peremption IS NULL OR date_peremption >= CURDATE())
         ORDER BY date_peremption IS NULL, date_peremption, date_entree, id
           FOR UPDATE
    ');
    $retrait = $pdo->prepare('UPDATE stock SET quantite_g = quantite_g - ? WHERE id = ?');

    $detail = [];
    foreach ($recette as $r) {
        $a_retirer = (float) $r['quantite_g'] * $facteur;
        $reste = $a_retirer;

        $lots->execute([$r['aliment_id']]);
        foreach ($lots->fetchAll() as $lot) {
            if ($reste <= EPSILON_G) {
                break;
            }
            $pris = min((float) $lot['quantite_g'], $reste);
            $retrait->execute([round($pris, 2), $lot['id']]);
            $reste -= $pris;
        }

        $detail[] = [
            'aliment' => $r['nom_aliment'],
            'retire_g' => round($a_retirer - max($reste, 0.0), 1),
            // Non nul seulement si le stock ne suffisait pas : on a retiré
            // tout ce qui restait, sans descendre sous zéro.
            'manquant_g' => $reste > EPSILON_G ? round($reste, 1) : 0,
        ];
    }

    $stmt = $pdo->prepare('
        INSERT INTO reclamation
            (astronaute_id, nom_astronaute, prenom_astronaute,
             repas_id, nom_repas, meal_type, portion_size, date_reclamation)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ');
    $stmt->execute([
        $astronaute_id,
        $nom_astronaute,
        $prenom_astronaute,
        $repas_id,
        $nom_repas,
        $meal_type,
        $portion_size,
    ]);
    $reclamation_id = (int) $pdo->lastInsertId();

    $pdo->commit();

    respond(200, [
        'success' => true,
        'id' => $reclamation_id,
        'nom_repas' => $nom_repas,
        'astronaute' => $prenom_astronaute !== null
            ? $prenom_astronaute . ' ' . $nom_astronaute
            : null,
        'kcal_recette' => (int) round($kcal_recette),
        'facteur' => round($facteur, 2),
        'stock_retire' => $detail,
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respondPdoError($e);
}