/**
 * Transport HTTP.
 *
 * Volontairement générique : cette couche ne sait rien des profils ni des
 * besoins nutritionnels. Elle sait envoyer une requête, l'abandonner si le
 * serveur ne répond pas, et transformer une panne réseau en résultat
 * exploitable plutôt qu'en exception qui ferait planter un écran.
 *
 * C'est ce qui permet à l'app de rester utilisable hors ligne : un appel
 * qui échoue renvoie { ok: false }, et l'appelant retombe sur le stockage
 * local sans que l'utilisateur voie une erreur.
 */

import { API_BASE_URL, API_ENABLED, API_KEY, API_TIMEOUT_MS } from '../config/api';

export type ApiFailureReason =
  | 'disabled'
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'server'
  | 'malformed';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: ApiFailureReason; status?: number; message: string };

type RequestOptions = {
  method?: 'GET' | 'POST';
  /** Corps sérialisé en JSON pour les requêtes POST. */
  body?: unknown;
  /** Paramètres ajoutés à l'URL, encodés. */
  query?: Record<string, string>;
};

/**
 * Appelle un point d'entrée de l'API.
 *
 * @param path chemin relatif, ex. "/profile.php"
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  if (!API_ENABLED) {
    return {
      ok: false,
      reason: 'disabled',
      message: 'Aucun serveur configuré : mode local uniquement.',
    };
  }

  const { method = 'GET', body, query } = options;

  // React Native n'implémente pas URL.searchParams : on construit la chaîne
  // à la main, sinon le paramètre ?id= serait silencieusement perdu.
  const queryString = query
    ? '?' +
      Object.entries(query)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
        )
        .join('&')
    : '';

  const url = `${API_BASE_URL}${path}${queryString}`;

  // AbortController : sans ça, une requête vers un serveur injoignable
  // peut rester en attente très longtemps et figer l'écran.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-Api-Key': API_KEY,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        reason: 'unauthorized',
        status: response.status,
        message: 'Clé API refusée par le serveur.',
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        reason: 'server',
        status: response.status,
        message: `Le serveur a répondu ${response.status}.`,
      };
    }

    const raw = await response.text();
    try {
      const data = JSON.parse(raw) as T;
      return { ok: true, data };
    } catch {
      return {
        ok: false,
        reason: 'malformed',
        message: `Réponse non-JSON (${raw.length} car) : ${raw.slice(0, 200)}`,
      };
    }
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('Abort'));

    return {
      ok: false,
      reason: aborted ? 'timeout' : 'network',
      message: aborted
        ? `Le serveur n'a pas répondu en ${API_TIMEOUT_MS / 1000} s.`
        : 'Serveur injoignable.',
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Test de disponibilité, utile pour afficher un état de connexion. */
export async function pingApi(): Promise<boolean> {
  const result = await apiRequest<unknown>('/ping.php');
  return result.ok;
}
