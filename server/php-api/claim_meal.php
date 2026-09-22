<?php
/**
 * Enregistre une réclamation de repas.
 *
 *   POST claim_meal.php  { repas_id, meal_type, portion_size }
 *
 * La table reclamation est créée automatiquement si elle n'existe pas,
 * comme dans la version d'origine.
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

if (!$repas_id || !$meal_type || !$portion_size) {
    respond(400, ['error' => 'Champs manquants']);
}

try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'reclamation'");
    $tableExists = $stmt->rowCount() > 0;

    if (!$tableExists) {
        $pdo->exec("
            CREATE TABLE reclamation (
                id int(11) NOT NULL AUTO_INCREMENT,
                repas_id int(11) DEFAULT NULL,
                meal_type varchar(50) NOT NULL,
                portion_size int(11) NOT NULL,
                date_reclamation datetime NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                FOREIGN KEY (repas_id) REFERENCES repas(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        ");
    }

    $stmt = $pdo->prepare('
        INSERT INTO reclamation (repas_id, meal_type, portion_size, date_reclamation)
        VALUES (?, ?, ?, NOW())
    ');
    $stmt->execute([$repas_id, $meal_type, $portion_size]);

    respond(200, ['success' => true]);
} catch (PDOException $e) {
    respondPdoError($e);
}
