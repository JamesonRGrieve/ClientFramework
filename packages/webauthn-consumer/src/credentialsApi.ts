// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { CreationCeremonySchema, createPasskey } from '@zephyrex/auth';
import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { type GuardedSave, serverInstant, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const CREDENTIAL_ENDPOINT = '/v1/webauthn/credential';
export const REGISTER_ENDPOINT = '/v1/webauthn/register';
/** The longest name the server keeps for a credential. */
export const DEVICE_NAME_MAX_LENGTH = 100;

const optionalText = z.string().nullable().optional();

/**
 * One of the user's passkeys or security keys. Only its name changes; the server stamps when it
 * was last used, and disables it (stamping when) if it ever presents a counter that went backwards.
 */
export const CredentialSchema = z.object({
  id: z.string(),
  device_name: optionalText,
  aaguid: optionalText,
  attestation_format: z.string(),
  attestation_trust: z.string(),
  /** Space-separated: usb, nfc, ble, internal, hybrid. */
  transports: optionalText,
  /** A passkey (a discoverable credential), which signs in without an email. */
  is_discoverable: z.boolean(),
  /** Synced across the user's devices, as last asserted. */
  backed_up: z.boolean(),
  backup_eligible: z.boolean(),
  last_used_at: optionalText,
  clone_detected_at: optionalText,
  is_enabled: z.boolean(),
  // The row's version, sent back verbatim as If-Match on every change.
  created_at: optionalText,
  updated_at: optionalText,
});
export type PasskeyCredential = z.infer<typeof CredentialSchema>;

const RegisteredSchema = z.object({ credential: CredentialSchema });

const path = (id: string): string => `${CREDENTIAL_ENDPOINT}/${encodeURIComponent(id)}`;
const NO_TIME = '1970-01-01T00:00:00';
const createdAt = ({ created_at: created }: PasskeyCredential): number => serverInstant(created ?? NO_TIME).getTime();

/** The user's credentials, newest first. */
export function useCredentials(): SWRResponse<PasskeyCredential[], Error> {
  const client = useClient();
  return useSWR<PasskeyCredential[], Error>(client.url(CREDENTIAL_ENDPOINT), async () =>
    (await client.list(CREDENTIAL_ENDPOINT, 'web_authn_credentials', CredentialSchema)).sort(
      (a, b) => createdAt(b) - createdAt(a),
    ),
  );
}

/** Where the new credential should live: this device, a security key, or whichever the browser offers. */
export type Attachment = 'platform' | 'cross-platform' | null;

/**
 * Registers a passkey or security key to the signed-in user: the server's options, the browser's
 * ceremony, then the server's check; resolves to the stored credential.
 */
export async function registerPasskey(
  client: ZephyrexClient,
  attachment: Attachment,
  deviceName: string | null,
): Promise<PasskeyCredential> {
  const opened = CreationCeremonySchema.parse(
    await client.post(`${REGISTER_ENDPOINT}/options`, attachment === null ? {} : { authenticator_attachment: attachment }),
  );
  const credential = await createPasskey(opened.public_key);
  const stored = await client.post(`${REGISTER_ENDPOINT}/verify`, {
    ceremony_id: opened.ceremony_id,
    credential,
    device_name: deviceName,
  });
  return RegisteredSchema.parse(stored).credential;
}

export interface CredentialActions {
  /** `rename.save(credential, { device_name })`: guarded by it as loaded. */
  rename: GuardedSave<PasskeyCredential>;
  /** `remove.save(credential, {})`: guarded by it as loaded. */
  remove: GuardedSave<PasskeyCredential>;
}

/** Renaming and removing the user's credentials, each refreshing the list. */
export function useCredentialActions(): CredentialActions {
  const client = useClient();
  const { mutate: refresh } = useCredentials();
  const rename = useCallback(
    async (seen: PasskeyCredential, changes: Partial<PasskeyCredential>): Promise<void> => {
      await client.put(path(seen.id), { web_authn_credential: { device_name: changes.device_name ?? null } }, seen);
      await refresh();
    },
    [client, refresh],
  );
  const remove = useCallback(
    async (seen: PasskeyCredential): Promise<void> => {
      await client.delete(path(seen.id), seen);
      await refresh();
    },
    [client, refresh],
  );
  return { rename: useGuardedSave(rename, CredentialSchema), remove: useGuardedSave(remove, CredentialSchema) };
}
