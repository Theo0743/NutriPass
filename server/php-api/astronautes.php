<?php
/**
 * Lecture des astronautes, adaptée à la structure réelle de la base.
 *
 * Fait les jointures nécessaires (niveau d'activité, allergies) et renvoie
 * l'objet dans la forme attendue par l'application mobile.
 *
 *   GET astronautes.php          -> liste
 *   GET astronautes.php?id=1     -> un astronaute
 */

declare(strict_types=1);

require __DIR__ . '/db.php';

$config = loadConfig();
requireApiKey($config);
$pdo = connect($config);

/** Âge révolu à partir de la date de naissance. */
function calculerAge(?string $dateNaissance): ?int
{
    if ($dateNaissance === null || $dateNaissance === '') {
        return null;
    }
    try {
        $naissance = new DateTimeImmutable($dateNaissance);
        return $naissance->diff(new DateTimeImmutable('today'))->y;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * L'enum `sexe` peut contenir M/F, H/F, Homme/Femme, male/female selon la
 * convention choisie. On accepte les variantes plutôt que d'en imposer une.
 */
function normaliserSexe(?string $sexe): string
{
    $valeur = strtolower(trim((string) $sexe));

    if (in_array($valeur, ['m', 'h', 'homme', 'male', 'masculin'], true)) {
        return 'male';
    }
    if (in_array($valeur, ['f', 'femme', 'female', 'feminin', 'féminin'], true)) {
        return 'female';
    }
    return 'other';
}

/**
 * Le coefficient de la base est la donnée qui fait foi. On lui associe
 * aussi le palier le plus proche parmi ceux que connaît l'application,
 * pour que l'affichage reste cohérent.
 */
function paliersActivite(?float $coefficient): string
{
    if ($coefficient === null) {
        return 'moderate';
    }

    $paliers = [
        'sedentary' => 1.2,
        'light' => 1.375,
        'moderate' => 1.55,
        'active' => 1.725,
        'extreme' => 1.9,
    ];

    $meilleur = 'moderate';
    $ecartMin = PHP_FLOAT_MAX;

    foreach ($paliers as $nom => $valeur) {
        $ecart = abs($valeur - $coefficient);
        if ($ecart < $ecartMin) {
            $ecartMin = $ecart;
            $meilleur = $nom;
        }
    }

    return $meilleur;
}

/** Allergies d'un astronaute, via la table de liaison. */
function chargerAllergies(PDO $pdo, int $astronauteId): array
{
    $requete = $pdo->prepare(
        'SELECT al.nom, aa.gravite
           FROM astronaute_allergie aa
           JOIN allergie al ON al.id = aa.allergie_id
          WHERE aa.astronaute_id = ?
          ORDER BY al.nom'
    );
    $requete->execute([$astronauteId]);

    return $requete->fetchAll();
}

/** Ligne SQL -> objet attendu par l'application. */
function construireProfil(PDO $pdo, array $ligne): array
{
    $coefficient = $ligne['niveau_coefficient'] !== null
        ? (float) $ligne['niveau_coefficient']
        : null;

    $allergies = chargerAllergies($pdo, (int) $ligne['id']);

    return [
        'profileId' => (string) $ligne['id'],
        'firstName' => $ligne['prenom'],
        'lastName' => $ligne['nom'],
        'birthDate' => $ligne['date_naissance'],
        'age' => calculerAge($ligne['date_naissance']),
        'sex' => normaliserSexe($ligne['sexe']),
        'heightCm' => (float) $ligne['taille_cm'],
        'weightKg' => (float) $ligne['poids_kg'],
        'activityLevel' => paliersActivite($coefficient),
        'activityLabel' => $ligne['niveau_libelle'],
        'activityCoefficient' => $coefficient,
        'allergies' => array_map(
            static fn (array $a): string => $a['nom'],
            $allergies
        ),
        'allergiesDetail' => $allergies,
    ];
}

const SELECT_ASTRONAUTE = '
    SELECT a.id, a.nom, a.prenom, a.taille_cm, a.poids_kg,
           a.date_naissance, a.sexe,
           n.libelle     AS niveau_libelle,
           n.coefficient AS niveau_coefficient
      FROM astronaute a
      LEFT JOIN niveau_activite n ON n.id = a.niveau_activite_id';

try {
    $id = $_GET['id'] ?? null;

    if ($id === null || $id === '') {
        $lignes = $pdo->query(SELECT_ASTRONAUTE . ' ORDER BY a.id LIMIT 200')->fetchAll();
        respond(200, array_map(
            static fn (array $l): array => construireProfil($pdo, $l),
            $lignes
        ));
    }

    $requete = $pdo->prepare(SELECT_ASTRONAUTE . ' WHERE a.id = ? LIMIT 1');
    $requete->execute([$id]);
    $ligne = $requete->fetch();

    if ($ligne === false) {
        respond(404, ['error' => 'Astronaute introuvable']);
    }

    respond(200, construireProfil($pdo, $ligne));
} catch (PDOException $e) {
    respondPdoError($e);
}