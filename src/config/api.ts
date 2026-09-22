/**
 * Configuration de l'accès réseau.
 *
 * Un seul endroit à modifier quand l'adresse du serveur change.
 *
 * ⚠️ Ce fichier part dans l'application installée. On n'y met JAMAIS
 * d'identifiants de base de données : ceux-ci restent côté serveur, dans
 * le config.php de l'API. Seule la clé partagée de l'API figure ici, et
 * elle ne donne accès qu'aux points d'entrée exposés, pas à la base.
 */

/**
 * Adresse de base de l'API, sans barre oblique finale.
 * À remplacer par le lien fourni.
 */
export const API_BASE_URL = 'https://bdd-test.f-dufour.com';

/** Clé partagée, doit correspondre à `api_key` dans config.php. */
export const API_KEY = 'FTTAzH1affy_mprEwX9fnVvs77WX6TOB';

/** Délai au-delà duquel une requête est abandonnée, en millisecondes. */
export const API_TIMEOUT_MS = 8000;

/**
 * Le projet est pensé pour fonctionner sans réseau. Tant que cette valeur
 * est false, l'app ignore complètement le serveur et se contente du
 * stockage local : elle reste donc utilisable en l'état.
 */
export const API_ENABLED = API_BASE_URL.length > 0;
