import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr';
import { ApiClient, getApiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export type ApiFetcher<T> = (client: ApiClient) => Promise<ApiResponse<T>>;

/**
 * Generic SWR wrapper that runs an ApiClient call. Returns the typed body
 * (response.data) — drop the envelope so consumers don't have to peel it.
 */
export function useApi<T>(
  key: string | readonly unknown[] | null,
  fetcher: ApiFetcher<T>,
  config?: SWRConfiguration<T>,
): SWRResponse<T> {
  const client = getApiClient();
  return useSWR<T>(
    key,
    async () => {
      const response = await fetcher(client);
      return response.data;
    },
    config,
  );
}
