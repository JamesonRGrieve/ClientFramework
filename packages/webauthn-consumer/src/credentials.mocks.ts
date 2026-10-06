// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory passkeys server for the package's tests and stories (never compiled into dist): the
// user's credentials as the server's REST routes (renamed and removed, each held to its version),
// and registration's two steps, which store a passkey from whatever the browser returned.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { restTable, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import { CREDENTIAL_ENDPOINT, CredentialSchema, type PasskeyCredential, REGISTER_ENDPOINT } from './credentialsApi';

/** When a fixture row was recorded, unless it says otherwise: its version until a test or story changes one. */
const FIXTURE_VERSION = '2026-10-01T09:00:00.000001';
export const LAPTOP_ID = 'cred-laptop';
export const KEY_ID = 'cred-key';
export const CLONED_ID = 'cred-cloned';

/** The creation options a registration opens with, as the server sends them. */
export const CREATION_OPTIONS = {
  challenge: 'Y2hhbGxlbmdl',
  rp: { id: 'localhost', name: 'Zephyrex' },
  user: { id: 'dS1tZQ', name: 'ada', displayName: 'Ada' },
  pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
  authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
};

export interface CredentialStore {
  credentials: PasskeyCredential[];
}

const credential = (id: string, fields: Partial<PasskeyCredential>): PasskeyCredential => ({
  id,
  device_name: null,
  aaguid: null,
  attestation_format: 'none',
  attestation_trust: 'none',
  transports: 'internal',
  is_discoverable: true,
  backed_up: false,
  backup_eligible: false,
  last_used_at: null,
  clone_detected_at: null,
  is_enabled: true,
  created_at: FIXTURE_VERSION,
  updated_at: null,
  ...fields,
});

/** A synced passkey, a security key, and a passkey disabled for a counter that went backwards. */
export function credentialsFixture(): CredentialStore {
  return {
    credentials: [
      credential(LAPTOP_ID, {
        device_name: 'Laptop',
        backed_up: true,
        backup_eligible: true,
        last_used_at: '2026-10-04T08:00:00',
        created_at: '2026-09-01T09:00:00',
      }),
      credential(KEY_ID, {
        device_name: 'YubiKey',
        is_discoverable: false,
        transports: 'usb nfc',
        created_at: '2026-09-02T09:00:00',
      }),
      credential(CLONED_ID, {
        is_enabled: false,
        clone_detected_at: '2026-09-20T12:00:00',
        created_at: '2026-08-01T09:00:00',
      }),
    ],
  };
}

const VerifyBodySchema = z.object({
  ceremony_id: z.string(),
  credential: z.record(z.string(), z.json()),
  device_name: z.string().nullable(),
});

/** The credential routes over `store`, with registration. */
export function credentialHandlers(store: CredentialStore = credentialsFixture()): RequestHandler[] {
  let registered = 0;
  return [
    http.post(`*${REGISTER_ENDPOINT}/options`, () =>
      HttpResponse.json({ ceremony_id: 'ceremony-1', public_key: CREATION_OPTIONS, expires_at: '2026-10-05T10:05:00Z' }),
    ),
    http.post(`*${REGISTER_ENDPOINT}/verify`, async ({ request }) => {
      const { device_name: name } = VerifyBodySchema.parse(await request.json());
      registered += 1;
      const stored = credential(`cred-new-${String(registered)}`, { device_name: name, created_at: versionStamp() });
      store.credentials = [...store.credentials, stored];
      return HttpResponse.json({ credential: stored });
    }),
    ...restTable({
      rows: () => store.credentials,
      set: (rows) => (store.credentials = rows),
      schema: CredentialSchema,
      endpoint: CREDENTIAL_ENDPOINT,
      single: 'web_authn_credential',
      plural: 'web_authn_credentials',
      filters: [],
    }),
  ];
}
