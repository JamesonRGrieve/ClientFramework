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

/** A provider's own health check, or the base one (required settings present) when it has none. */
const ProviderHealthSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  detail: z.string(),
});
export type ProviderHealth = z.infer<typeof ProviderHealthSchema>;

const RootProviderStatusEntrySchema = z.object({
  provider: z.string(),
  extension: z.string(),
  configured: z.boolean(),
  settings: z.array(RootProviderSettingSchema),
  /** Null unless the health checks were asked for. */
  health: ProviderHealthSchema.nullable(),
});
export type RootProviderStatusEntry = z.infer<typeof RootProviderStatusEntrySchema>;

const RootProviderStatusResponseSchema = z.object({ providers: z.array(RootProviderStatusEntrySchema) });
export type RootProviderStatusResponse = z.infer<typeof RootProviderStatusResponseSchema>;

export interface RootProviderStatusOptions {
  /** Only this extension's providers; an extension the server hasn't loaded has none. */
  extension?: string | undefined;
  /** Also run each provider's health check (the server caches each result for a minute). */
  health?: boolean | undefined;
}

/** The status endpoint's query for `options`. */
export function rootProviderStatusQuery({ extension, health }: RootProviderStatusOptions): Record<string, string> {
  return {
    ...(extension === undefined ? {} : { extension }),
    ...(health === true ? { health: 'true' } : {}),
  };
}

/** How each loaded provider's environment (root) configuration stands. Root only: anyone else gets a 403. */
export function useRootProviderStatus(
  options: RootProviderStatusOptions = {},
): SWRResponse<RootProviderStatusResponse, Error> {
  const client = useClient();
  const query = rootProviderStatusQuery(options);
  return useSWR<RootProviderStatusResponse, Error>(client.url(ROOT_PROVIDER_STATUS_PATH, query), async () =>
    RootProviderStatusResponseSchema.parse(await client.get(ROOT_PROVIDER_STATUS_PATH, query)),
  );
}
