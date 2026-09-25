/**
 * Écoute du lecteur NFC de la borne.
 *
 * Interroge régulièrement le programme du Raspberry (voir config/nfc.ts) et
 * prévient l'application quand la valeur lue change.
 *
 * La première réponse sert de référence et n'est jamais traitée comme un
 * scan : sinon, la dernière carte lue avant l'ouverture de l'écran d'attente
 * reconnecterait automatiquement la personne précédente.
 */

import {
  NFC_POLL_INTERVAL_MS,
  NFC_READER_URL,
  NFC_REQUEST_TIMEOUT_MS,
} from '../config/nfc';

export type BadgeScan = {
  /** Identifiant écrit sur la carte, soit astronaute.id. */
  id: string;
  /** Heure à laquelle l'application a détecté le scan. */
  scannedAt: number;
};

/**
 * Lit la valeur actuelle du lecteur.
 *   - une chaîne : l'identifiant renvoyé ;
 *   - { value: null } : le lecteur répond mais sans identifiant ;
 *   - null : le lecteur ne répond pas (programme arrêté, réseau…).
 *
 * Accepte le texte brut ("12") comme le JSON ({"id":"12"}), au cas où le
 * format du programme change.
 */
async function readCurrentValue(): Promise<{ value: string | null } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NFC_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(NFC_READER_URL, { signal: controller.signal });
    if (!response.ok) return null;

    let text = (await response.text()).trim();

    if (text.startsWith('{')) {
      try {
        const data = JSON.parse(text) as { id?: unknown };
        text = typeof data.id === 'string' || typeof data.id === 'number'
          ? String(data.id).trim()
          : '';
      } catch {
        text = '';
      }
    }

    return { value: text !== '' ? text : null };
  } catch {
    // Lecteur éteint, programme arrêté, ou appel bloqué par le navigateur.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Appelle `onBadge` chaque fois que le lecteur renvoie un nouvel identifiant.
 * Renvoie la fonction qui arrête l'écoute.
 */
export function listenForBadges(
  onBadge: (scan: BadgeScan) => void,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  // undefined : aucune réponse reçue encore. null : réponse sans identifiant.
  let reference: string | null | undefined;

  const poll = async () => {
    const result = await readCurrentValue();
    if (stopped) return;

    if (result !== null) {
      if (reference === undefined) {
        reference = result.value;
      } else if (result.value !== reference) {
        reference = result.value;
        // Seul un identifiant numérique correspond à un astronaute.
        if (result.value !== null && /^\d+$/.test(result.value)) {
          onBadge({ id: result.value, scannedAt: Date.now() });
        }
      }
    }

    // L'interrogation suivante ne part qu'une fois la précédente terminée,
    // pour ne jamais empiler les requêtes si le lecteur est lent.
    timer = setTimeout(() => void poll(), NFC_POLL_INTERVAL_MS);
  };

  void poll();

  return () => {
    stopped = true;
    if (timer !== null) clearTimeout(timer);
  };
}
