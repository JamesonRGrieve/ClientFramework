// SPDX-License-Identifier: AGPL-3.0-or-later
// Device pairing (auth_device_pairing): a new device shows a QR code carrying a one-time token; a
// signed-in device opens it (<authPath>/pair/approve?token=…) and approves or denies the sign-in.
// The new device learns the answer by polling the pairing's status; the read that first sees it
// approved (with the HttpOnly binding cookie /request set) signs it in.
import { authRequest } from '@zephyrex/auth/lib/api';
import { z } from 'zod';

export const PAIRING_ENDPOINT = '/v1/auth/pairing';

const PairingAnswerSchema = z.object({ pairing_id: z.string(), state: z.enum(['approved', 'denied']) });
export type PairingAnswer = z.infer<typeof PairingAnswerSchema>;

export type PairingDecision = 'approve' | 'deny';

/** Approve or deny the pairing `token` names, as the signed-in user. */
export async function answerPairing(authServer: string, token: string, decision: PairingDecision): Promise<PairingAnswer> {
  return authRequest(`${authServer}${PAIRING_ENDPOINT}/${decision}`, PairingAnswerSchema, {
    method: 'POST',
    body: { token },
  });
}

const PairingStartSchema = z.object({ pairing_id: z.string(), qr_payload: z.string(), expires_in: z.number() });
export type PairingStart = z.infer<typeof PairingStartSchema>;

/**
 * Ask to be signed in from another device. The binding stays in the HttpOnly cookie the server
 * sets (no `token_in_body`: that is for native clients), so only this browser can collect the session.
 */
export async function requestPairing(authServer: string): Promise<PairingStart> {
  return authRequest(`${authServer}${PAIRING_ENDPOINT}/request`, PairingStartSchema, {
    method: 'POST',
    body: { requesting_device_type: 'web' },
  });
}

const PairingStatusSchema = z.object({
  pairing_id: z.string(),
  state: z.enum(['pending', 'approved', 'denied', 'expired']),
});
export type PairingState = z.infer<typeof PairingStatusSchema>['state'];

/** Where the pairing stands; on the first read that finds it approved, the server sets the session. */
export async function pairingStatus(authServer: string, pairingId: string): Promise<PairingState> {
  return authRequest(`${authServer}${PAIRING_ENDPOINT}/${encodeURIComponent(pairingId)}/status`, PairingStatusSchema).then(
    (status) => status.state,
  );
}
