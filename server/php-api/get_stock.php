<?php
/**
 * État du stock du vaisseau, aliment par aliment.
 *
 *   GET get_stock.php
 *   -> { data: [{ id, name, category, quantityG, batches,
 *                 nextExpiry, expiredG }] }
 *
 * Un aliment peut avoir plusieurs lots en stock, avec des dates de
 * péremption différentes. On additionne les lots encore valides, et on
 * compte séparément ce qui est périmé — cette quantité existe encore
 * physiquement à bord, mais n'est plus consommable.
 *
 * Les aliments absents du stock apparaissent avec une quantité de 0
 * (jointure à gauche), pour que l'inventaire reste complet.
 */

declare(strict_types=1);

require __DIR__ . '/db.php';

$config = loadConfig();
requireApiKey($config);
$pdo = connect($config);

try {
    $lignes = $pdo->query('
        SELECT a.id,
               a.nom,
               a.categorie,
               COALESCE(SUM(
                   CASE WHEN s.date_peremption IS NULL
                          OR s.date_peremption >= CURDATE()
                        THEN s.quantite_g ELSE 0 END
               ), 0) AS quantite_valide,
               COALESCE(SUM(
                   CASE WHEN s.date_peremption IS NOT NULL
                          AND s.date_peremption < CURDATE()
                        THEN s.quantite_g ELSE 0 END
               ), 0) AS quantite_perimee,
               COUNT(s.id) AS nb_lots,
               MIN(
                   CASE WHEN s.date_peremption >= CURDATE()
                        THEN s.date_peremption END
               ) AS prochaine_peremption
          FROM aliment a
          LEFT JOIN stock s ON s.aliment_id = a.id
         GROUP BY a.id, a.nom, a.categorie
         ORDER BY a.nom
    ')->fetchAll();

    $result = [];
    foreach ($lignes as $l) {
        $result[] = [
            'id' => (string) $l['id'],
            'name' => $l['nom'],
            'category' => $l['categorie'],
            'quantityG' => round((float) $l['quantite_valide'], 1),
            'expiredG' => round((float) $l['quantite_perimee'], 1),
            'batches' => (int) $l['nb_lots'],
            'nextExpiry' => $l['prochaine_peremption'],
        ];
    }

    respond(200, [
        'data' => $result,
        'generatedAt' => date('c'),
    ]);
} catch (PDOException $e) {
    respondPdoError($e);
} catch (Throwable $e) {
    error_log('NutriPass - get_stock : ' . $e->getMessage());
    respond(500, ['error' => 'Erreur serveur']);
}
