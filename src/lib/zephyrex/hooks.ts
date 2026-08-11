// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { createContext, useContext, useMemo } from 'react';
import useSWR from 'swr';
import { ZephyrexClient } from './client';
import { useZephyrexConfig } from './ZephyrexProvider';

// --- Client ---

const ClientContext = createContext<ZephyrexClient | null>(null);
export const ClientProvider = ClientContext.Provider;

export function useClient(): ZephyrexClient {
  const ctx = useContext(ClientContext);
  if (ctx) return ctx;
  const { config } = useZephyrexConfig();
  return new ZephyrexClient({ baseUrl: config.server.baseUrl });
}

// --- User ---

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  role_id?: string;
  [key: string]: unknown;
}

export function useUser() {
  const client = useClient();
  return useSWR<User>('/v1/user', () => client.get('/v1/user'));
}

// --- Role ---

export function useRole() {
  const { data: user } = useUser();
  return useMemo(
    () => ({
      isAdmin: user?.role_id === 'FFFFFFFF-0000-0000-AAAA-FFFFFFFFFFFF' ||
               user?.role_id === 'FFFFFFFF-0000-0000-FFFF-FFFFFFFFFFFF',
      isSuperAdmin: user?.role_id === 'FFFFFFFF-0000-0000-FFFF-FFFFFFFFFFFF',
      roleId: user?.role_id ?? null,
    }),
    [user?.role_id],
  );
}

// --- Teams ---

export interface Team {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export function useTeams() {
  const client = useClient();
  return useSWR<Team[]>('/v1/team', async () => {
    const res = await client.get<{ teams?: Team[] }>('/v1/team');
    return res.teams ?? (Array.isArray(res) ? res : []);
  });
}

export function useTeam(id?: string) {
  const client = useClient();
  return useSWR<Team>(id ? `/v1/team/${id}` : null, () => client.get(`/v1/team/${id}`));
}

// --- Extensions (server-side) ---

export interface ServerExtension {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export function useServerExtensions() {
  const client = useClient();
  return useSWR<ServerExtension[]>('/v1/extension', async () => {
    const res = await client.get<{ extensions?: ServerExtension[] }>('/v1/extension');
    return res.extensions ?? (Array.isArray(res) ? res : []);
  });
}

// --- Providers ---

export interface Provider {
  id: string;
  name: string;
  [key: string]: unknown;
}

export function useProviders() {
  const client = useClient();
  return useSWR<Provider[]>('/v1/provider', async () => {
    const res = await client.get<{ providers?: Provider[] }>('/v1/provider');
    return res.providers ?? (Array.isArray(res) ? res : []);
  });
}

// --- Notifications ---

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  [key: string]: unknown;
}

export function useNotifications() {
  const client = useClient();
  return useSWR<Notification[]>('/v1/notification', async () => {
    try {
      const res = await client.get<{ notifications?: Notification[] }>('/v1/notification');
      return res.notifications ?? (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  });
}
