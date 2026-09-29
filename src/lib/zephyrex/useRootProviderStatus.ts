// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { useClient } from './hooks';

export const ROOT_PROVIDER_STATUS_PATH = '/v1/provider/root/status';

/** One environment setting a provider reads. A secret's `value` is always null; `set` says whether it has one. */
export interface RootProviderSetting {
  key: string;
  secret: boolean;
  set: boolean;
  value: string | null;
}

export interface RootProviderStatusEntry {
  provider: string;
  extension: string;
  configured: boolean;
  settings: RootProviderSetting[];
}

export interface RootProviderStatusResponse {
  providers: RootProviderStatusEntry[];
}

/** How each loaded provider's environment (root) configuration stands. Root only: anyone else gets a 403. */
export function useRootProviderStatus(): SWRResponse<RootProviderStatusResponse, Error> {
  const client = useClient();
  return useSWR<RootProviderStatusResponse, Error>(ROOT_PROVIDER_STATUS_PATH, async () =>
    client.get<RootProviderStatusResponse>(ROOT_PROVIDER_STATUS_PATH),
  );
}
