<?php
/**
 * Vérifie le code d'un astronaute après le scan de son pass.
 *
 *   POST verify_code.php  { astronaute_id, code }
 *   -> { valid: true }
 *   -> { valid: false, error: "Code incorrect" }
 *
 * Le code est stocké hashé dans astronaute.mdp (password_hash, format $2y$).
 * On le compare avec password_verify() et on ne renvoie jamais le hash.
 *
 * Toutes les réponses « métier » (code faux, pass inconnu) sont en HTTP 200
 * avec valid:false. Un 401 serait interprété par l'application comme une
 * clé API refusée, et afficherait un message trompeur.
 */

declare(strict_types=1);

require __DIR__ . '/db.php';

$config = loadConfig();
requireApiKey($config);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['error' => 'Méthode non autorisée']);
}

$input = jsonBody();

$astronaute_id = isset($input['astronaute_id']) ? (int) $input['astronaute_id'] : 0;
$code = isset($input['code']) ? (string) $input['code'] : '';

if ($astronaute_id <= 0 || $code === '' || strlen($code) > 32) {
    respond(400, ['error' => 'Champs manquants ou invalides']);
}

$pdo = connect($config);

try {
    $stmt = $pdo->prepare('SELECT mdp FROM astronaute WHERE id = ? LIMIT 1');
    $stmt->execute([$astronaute_id]);
    $ligne = $stmt->fetch();

    if ($ligne === false) {
        respond(200, ['valid' => false, 'error' => 'Pass inconnu']);
    }

    $hash = (string) ($ligne['mdp'] ?? '');
    if ($hash === '') {
        respond(200, ['valid' => false, 'error' => 'Aucun code défini pour ce pass']);
    }

    if (!password_verify($code, $hash)) {
        // Petit délai sur un échec : ralentit les essais en rafale sans gêner
        // quelqu'un qui s'est simplement trompé.
        usleep(300000);
        respond(200, ['valid' => false, 'error' => 'Code incorrect']);
    }

    respond(200, ['valid' => true]);
} catch (PDOException $e) {
    respondPdoError($e);
}
