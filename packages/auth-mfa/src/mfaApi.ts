// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { useClient, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const MFA_ENDPOINT = '/v1/user/mfa';
const DEFAULT_RECOVERY_CODES = 10;

export const MfaMethodSchema = z.object({
  id: z.string(),
  method_type: z.enum(['totp', 'email', 'sms']),
  identifier: z.string().nullable().optional(),
  is_enabled: z.boolean(),
  is_primary: z.boolean(),
  /** True once the user proved they hold the factor; until then it is a pending setup. */
  verification: z.boolean(),
  last_used: z.string().nullable().optional(),
});
export type MfaMethod = z.infer<typeof MfaMethodSchema>;

const MethodEnvelopeSchema = z.object({ multifactor_method: MfaMethodSchema });

/** What an authenticator app needs to enrol; only available until the method is verified. */
export const TotpProvisioningSchema = z.object({ provisioning_uri: z.string(), secret: z.string() });
export type TotpProvisioning = z.infer<typeof TotpProvisioningSchema>;

const VerifiedSchema = z.object({ verified: z.boolean() });
const RecoveryCodesSchema = z.array(z.string());

const methodPath = (id: string, action: string): string => `${MFA_ENDPOINT}/${encodeURIComponent(id)}/${action}`;

/** The signed-in user's second factors: enrol, verify, replace recovery codes, turn off or remove. */
export const mfaApi = {
  list: async (client: ZephyrexClient): Promise<MfaMethod[]> =>
    client.list(MFA_ENDPOINT, 'multifactor_methods', MfaMethodSchema),

  createTotp: async (client: ZephyrexClient): Promise<MfaMethod> =>
    MethodEnvelopeSchema.parse(await client.post(MFA_ENDPOINT, { multifactor_method: { method_type: 'totp' } }))
      .multifactor_method,

  provisioning: async (client: ZephyrexClient, id: string): Promise<TotpProvisioning> =>
    TotpProvisioningSchema.parse(await client.get(methodPath(id, 'totp/provisioning'))),

  /** Enrol (or re-check) a method with a current code; resolves whether the code was right. */
  verify: async (client: ZephyrexClient, id: string, code: string): Promise<boolean> =>
    VerifiedSchema.parse(await client.post(methodPath(id, 'verify'), { code })).verified,

  /** Replace the method's recovery codes; the plaintext codes are returned this once. */
  generateRecoveryCodes: async (client: ZephyrexClient, id: string, count = DEFAULT_RECOVERY_CODES): Promise<string[]> =>
    RecoveryCodesSchema.parse(await client.post(methodPath(id, 'recovery/generate'), { count })),

  /** A verified method needs a current TOTP or recovery code; a pending one needs none. */
  disable: async (client: ZephyrexClient, id: string, code?: string): Promise<void> => {
    await client.post(methodPath(id, 'disable'), code === undefined ? {} : { code });
  },

  remove: async (client: ZephyrexClient, id: string, code?: string): Promise<void> => {
    await client.post(methodPath(id, 'delete'), code === undefined ? {} : { code });
  },
};

/** The signed-in user's MFA methods. */
export function useMfaMethods(): SWRResponse<MfaMethod[], Error> {
  const client = useClient();
  return useSWR<MfaMethod[], Error>(client.url(MFA_ENDPOINT), async () => mfaApi.list(client));
}
