// SPDX-License-Identifier: AGPL-3.0-or-later
import useSWR, { type SWRResponse } from 'swr';
import { type Provider, ProviderSchema } from './z';
import { createGraphQLClient } from '@zephyrex/auth/hooks/lib';
import z, { GQLType } from '@zephyrex/zod2gql';
import log from '@/lib/log';

// ============================================================================
// Provider Related Hooks
// ============================================================================

/**
 * Hook to fetch and manage provider data
 * @param providerName - Optional provider name to fetch specific provider
 * @returns SWR response containing provider data
 */
export function useProvider(providerName?: string): SWRResponse<Provider | null> {
  const client = createGraphQLClient();

  return useSWR<Provider | null>(
    providerName ? [`/provider`, providerName] : null,
    async (): Promise<Provider | null> => {
      try {
        const query = ProviderSchema.toGQL(GQLType.Query, {
          operationName: 'GetProvider',
          variables: { providerName: providerName ?? null },
        });
        const response = await client.request<Record<string, unknown>>(query, {
          providerName,
        });
        return ProviderSchema.parse(response.provider);
      } catch (error) {
        log(['GQL useProvider() Error', error], {
          client: 1,
        });
        return null;
      }
    },
    { fallbackData: null },
  );
}

/**
 * Hook to fetch and manage all providers
 * @returns SWR response containing array of providers
 */
export function useProviders(): SWRResponse<Provider[]> {
  const client = createGraphQLClient();

  return useSWR<Provider[]>(
    '/providers',
    async (): Promise<Provider[]> => {
      try {
        const query = ProviderSchema.toGQL(GQLType.Query, { operationName: 'GetProviders' });
        const response = await client.request<Record<string, unknown>>(query);
        log(['GQL useProviders() Response', response], {
          client: 3,
        });
        const validated = z.array(ProviderSchema).parse(response.providers);
        log(['GQL useProviders() Validated', validated], {
          client: 3,
        });
        return validated;
      } catch (error) {
        log(['GQL useProviders() Error', error], {
          client: 1,
        });
        return [];
      }
    },
    { fallbackData: [] },
  );
}
