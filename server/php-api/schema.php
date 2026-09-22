<?php
/**
 * Décrit la base : tables, colonnes, types.
 *
 * C'est le point d'entrée à appeler EN PREMIER après le dépôt sur le
 * serveur. Il permet de découvrir la structure sans passer par
 * phpMyAdmin, puis d'ajuster mapping.php aux vrais noms.
 */

declare(strict_types=1);

require __DIR__ . '/db.php';

$config = loadConfig();
requireApiKey($config);
$pdo = connect($config);

try {
    $statement = $pdo->prepare(
        'SELECT TABLE_NAME   AS tableName,
                COLUMN_NAME  AS columnName,
                DATA_TYPE    AS dataType,
                IS_NULLABLE  AS nullable,
                COLUMN_KEY   AS keyType
           FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = ?
          ORDER BY TABLE_NAME, ORDINAL_POSITION'
    );
    $statement->execute([$config['db_name']]);

    $tables = [];
    foreach ($statement->fetchAll() as $row) {
        $tables[$row['tableName']][] = [
            'column' => $row['columnName'],
            'type' => $row['dataType'],
            'nullable' => $row['nullable'] === 'YES',
            'key' => $row['keyType'] !== '' ? $row['keyType'] : null,
        ];
    }

    respond(200, [
        'database' => $config['db_name'],
        'tableCount' => count($tables),
        'tables' => $tables,
    ]);
} catch (PDOException $e) {
    respondPdoError($e);
}
