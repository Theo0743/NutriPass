/**
 * Lecteur NFC de la borne.
 *
 * Sur le Raspberry, le programme du lecteur lit la carte (texte écrit avec
 * NFC Tools, par exemple "12") et renvoie l'identifiant en texte brut :
 *
 *   GET http://localhost:8080/   ->   12
 *
 * L'application détecte un nouveau scan quand cette valeur change. Si le
 * programme garde la même valeur après le retrait de la carte, un second
 * passage de la même carte n'est donc pas détecté : limite acceptée.
 *
 * Le programme doit autoriser les appels depuis la page (en-tête
 * Access-Control-Allow-Origin), sinon le navigateur bloque la lecture.
 *
 * Le port 8080 étant pris par le lecteur, l'application NutriPass doit être
 * servie sur un autre port du Raspberry.
 */

export const NFC_READER_URL = 'http://localhost:8080/';

/** Intervalle entre deux interrogations du lecteur, en millisecondes. */
export const NFC_POLL_INTERVAL_MS = 500;

/** Au-delà, une interrogation est abandonnée et la suivante prend le relais. */
export const NFC_REQUEST_TIMEOUT_MS = 1500;
