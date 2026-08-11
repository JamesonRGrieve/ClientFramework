// SPDX-License-Identifier: AGPL-3.0-or-later
import axios from 'axios';
import { getCookie } from 'cookies-next';
import useSWR, { type SWRResponse } from 'swr';

export type ProviderInstance = {
  provider_id: string;
  team_id: string;
  user_id: string;
  name: string;
  updated_at: string;
  updated_by_user_id: string;
  id: string;
  created_at: string;
  created_by_user_id: string;
  model_name: string;
  api_key: string;
  enabled: boolean;
};

const readJwt = (): string => {
  const jwt = getCookie('jwt');
  return typeof jwt === 'string' ? jwt : '';
};

/**
 * Hook to fetch provider instances for the current team
 * @returns SWR response containing array of provider instances
 */
export function useProviderInstances(): SWRResponse<ProviderInstance[]> {
  return useSWR<ProviderInstance[]>(
    `/v1/provider/instance`,
    async (): Promise<ProviderInstance[]> => {
      const teamId = getCookie('auth-team');
      const response = await axios.get<{ provider_instances?: ProviderInstance[] }>(
        `${process.env.NEXT_PUBLIC_API_URI}/v1/provider/instance`,
        {
          params: { team_id: teamId },
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${readJwt()}`,
          },
        },
      );
      return response.data.provider_instances ?? [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
}

export function useProviderInstance(id: string | undefined): SWRResponse<ProviderInstance | null> {
  return useSWR<ProviderInstance | null>(
    id !== undefined && id !== '' ? `/v1/provider/instance/${id}` : null,
    async (): Promise<ProviderInstance | null> => {
      const response = await axios.get<{ provider_instance?: ProviderInstance }>(
        `${process.env.NEXT_PUBLIC_API_URI}/v1/provider/instance/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${readJwt()}`,
          },
        },
      );
      return response.data.provider_instance ?? null;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
}
