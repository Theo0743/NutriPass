/**
 * Vérification du code de l'astronaute après le scan de son pass.
 */

import { apiRequest } from './apiService';

type VerifyResponse = { valid?: boolean; error?: string };

export type VerifyResult = { ok: true } | { ok: false; message: string };

export async function verifyCode(
  astronauteId: string,
  code: string,
): Promise<VerifyResult> {
  const response = await apiRequest<VerifyResponse>('/verify_code.php', {
    method: 'POST',
    body: { astronaute_id: astronauteId, code },
  });

  if (!response.ok) {
    return { ok: false, message: response.message };
  }

  if (response.data.valid === true) {
    return { ok: true };
  }

  return { ok: false, message: response.data.error ?? 'Code incorrect' };
}
