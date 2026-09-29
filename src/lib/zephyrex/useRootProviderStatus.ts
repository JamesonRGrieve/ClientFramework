// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { z } from 'zod';
import { useClient } from './hooks';

export const ROOT_PROVIDER_STATUS_PATH = '/v1/provider/root/status';

/** One environment setting a provider reads. A secret's `value` is always null; `set` says whether it has one. */
const RootProviderSettingSchema = z.object({
  key: z.string(),
  secret: z.boolean(),
  set: z.boolean(),
  value: z.string().nullable(),
});
export type RootProviderSetting = z.infer<typeof RootProviderSettingSchema>;

const RootProviderStatusEntrySchema = z.object({
  provider: z.string(),
  extension: z.string(),
  configured: z.boolean(),
  settings: z.array(RootProviderSettingSchema),
});
export type RootProviderStatusEntry = z.infer<typeof RootProviderStatusEntrySchema>;

const RootProviderStatusResponseSchema = z.object({ providers: z.array(RootProviderStatusEntrySchema) });
export type RootProviderStatusResponse = z.infer<typeof RootProviderStatusResponseSchema>;

/** How each loaded provider's environment (root) configuration stands. Root only: anyone else gets a 403. */
export function useRootProviderStatus(): SWRResponse<RootProviderStatusResponse, Error> {
  const client = useClient();
  return useSWR<RootProviderStatusResponse, Error>(ROOT_PROVIDER_STATUS_PATH, async () =>
    RootProviderStatusResponseSchema.parse(await client.get(ROOT_PROVIDER_STATUS_PATH)),
  );
}
