<?php
/**
 * Test de vie. Ne touche pas à la base et n'exige pas la clé :
 * il sert à vérifier que l'API est joignable, indépendamment du reste.
 */

declare(strict_types=1);

require __DIR__ . '/db.php';

respond(200, [
    'ok' => true,
    'service' => 'nutripass-php-api',
    'php' => PHP_VERSION,
]);
