<?php
/**
 * Socle commun à tous les points d'entrée.
 *
 * Ce fichier tourne SUR le serveur d'hébergement, donc il atteint MySQL
 * en local : aucun pare-feu entre PHP et la base. C'est toute la raison
 * d'être de cette version, l'accès distant au port 3306 étant fermé.
 *
 * Compatible PHP 8.0+.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Requête de pré-vérification envoyée par certains clients avant le vrai appel.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/** Écrit une réponse JSON et arrête le script. */
function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function loadConfig(): array
{
    $path = __DIR__ . '/config.php';
    if (!is_file($path)) {
        respond(500, ['error' => 'config.php absent du serveur']);
    }
    return require $path;
}

/**
 * Vérifie la clé partagée.
 *
 * hash_equals compare en temps constant : une comparaison ordinaire
 * s'arrête au premier caractère différent, ce qui permet de deviner la
 * clé caractère par caractère en mesurant le temps de réponse.
 */
function requireApiKey(array $config): void
{
    $sent = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if ($sent === '' || !hash_equals((string) $config['api_key'], $sent)) {
        respond(401, ['error' => 'Clé API invalide ou absente']);
    }
}

function connect(array $config): PDO
{
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $config['db_host'],
        (int) ($config['db_port'] ?? 3306),
        $config['db_name'],
        $config['db_charset'] ?? 'utf8mb4'
    );

    try {
        return new PDO($dsn, $config['db_user'], $config['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Préparation réelle côté MySQL, pas une émulation en PHP.
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        // Le message brut contient l'hôte et l'utilisateur : il reste dans
        // les journaux du serveur et ne part jamais vers le client.
        error_log('NutriPass - connexion base : ' . $e->getMessage());
        respond(500, [
            'error' => 'Connexion à la base impossible',
            'hint' => 'Vérifier db_host, db_name, db_user et db_pass dans config.php',
        ]);
    }
}

/**
 * Les noms de table et de colonne ne peuvent pas être passés en `?` :
 * MySQL n'accepte des emplacements que pour des valeurs. On les valide
 * donc strictement avant de les insérer dans la requête.
 */
function quoteIdentifier(string $name): string
{
    if (preg_match('/^[A-Za-z0-9_]+$/', $name) !== 1) {
        respond(500, ['error' => 'Identifiant SQL invalide : ' . $name]);
    }
    return '`' . $name . '`';
}

/** Corps JSON de la requête, tableau vide s'il est absent ou illisible. */
function jsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/** Traduit une erreur SQL en message exploitable. */
function respondPdoError(PDOException $e): void
{
    error_log('NutriPass - SQL : ' . $e->getMessage());

    $known = [
        '42S02' => 'La table configurée n\'existe pas. Appeler schema.php puis corriger mapping.php.',
        '42S22' => 'Une colonne de mapping.php n\'existe pas. Appeler schema.php pour voir les vrais noms.',
        '42000' => 'Requête refusée par MySQL : droits insuffisants ou syntaxe invalide.',
    ];

    $code = (string) $e->getCode();
    respond(500, [
        'error' => $known[$code] ?? 'Erreur SQL',
        'code' => $code,
    ]);
}
