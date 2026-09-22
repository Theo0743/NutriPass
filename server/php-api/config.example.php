<?php
/**
 * À COPIER en config.php sur le serveur, puis à remplir.
 * config.php n'est jamais versionné : il contient les identifiants.
 */

return [
    // PHP tourne sur la même machine que MySQL : « localhost » convient
    // presque toujours sur un hébergement mutualisé.
    'db_host' => 'localhost',
    'db_port' => 3306,
    'db_name' => 'foodtech_test',
    'db_user' => 'foodtech_admin',
    'db_pass' => 'MOT_DE_PASSE',
    'db_charset' => 'utf8mb4',

    // Doit être identique à API_KEY dans src/config/api.ts côté application.
    'api_key' => 'FTTAzH1affy_mprEwX9fnVvs77WX6TOB',
];
