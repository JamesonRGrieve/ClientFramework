// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { hasSession } from '@zephyrex/auth';
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { z } from 'zod';
import { HTTP_STATUS } from '../api/httpStatus';
import { ApiError, ZephyrexClient } from './client';
import { activeTeamId, setActiveTeam, teamToActivate } from './cookies';
import { useZephyrexConfig } from './ZephyrexProvider';

// --- Client ---

const ClientContext = createContext<ZephyrexClient | null>(null);
export const ClientProvider = ClientContext.Provider;

export function useClient(): ZephyrexClient {
  const ctx = useContext(ClientContext);
  const { config } = useZephyrexConfig();
  const baseUrl = config.server.baseUrl;
  const fallback = useMemo(() => new ZephyrexClient({ baseUrl }), [baseUrl]);
  return ctx ?? fallback;
}

// --- Session ---

// The session cookie can't be observed for changes; each render reads it afresh.
const subscribeToNothing = (): (() => void) => () => undefined;
const signedOutOnServer = (): boolean => false;

/**
 * Whether this browser holds a session, safe to render with: the server can't read the cookie, so
 * it renders signed out, and hydration does too before the client re-renders with the cookie.
 * Reading `hasSession()` during render instead makes the server and the first client render
 * disagree for a signed-in user, a hydration mismatch.
 */
export function useHasSession(): boolean {
  return useSyncExternalStore(subscribeToNothing, hasSession, signedOutOnServer);
}

const optionalText = z.string().nullable().optional();

// --- User ---

const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: optionalText,
  last_name: optionalText,
  display_name: optionalText,
  username: optionalText,
  timezone: optionalText,
  language: optionalText,
});
export type User = z.infer<typeof UserSchema>;

/**
 * The signed-in user (GET /v1/user answers `{ user }`). Without a session nothing is asked, so the
 * shell can call this on every page without drawing a 401 for a signed-out visitor.
 */
export function useUser(): SWRResponse<User, Error> {
  const client = useClient();
  return useSWR<User, Error>(
    useHasSession() ? '/v1/user' : null,
    async () => z.object({ user: UserSchema }).parse(await client.get('/v1/user')).user,
  );
}

// --- Role ---

export const SUPERADMIN_ROLE_ID = 'FFFFFFFF-0000-0000-FFFF-FFFFFFFFFFFF';
export const ADMIN_ROLE_ID = 'FFFFFFFF-0000-0000-AAAA-FFFFFFFFFFFF';

const TeamMembershipSchema = z.object({
  user_id: z.string(),
  team_id: z.string(),
  role_id: z.string(),
});
export type TeamMembership = z.infer<typeof TeamMembershipSchema>;

export interface Role {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  roleId: string | null;
}

/**
 * The signed-in user's role in `teamId` (default: the active team). Roles belong to team
 * memberships, not users, so this reads the team's members (GET /v1/team/{id}/user).
 */
export function useRole(teamId: string | null = activeTeamId()): Role {
  const client = useClient();
  const { data: user } = useUser();
  const { data: members } = useSWR<TeamMembership[], Error>(
    teamId === null ? null : `/v1/team/${teamId}/user`,
    async () =>
      z.object({ user_teams: z.array(TeamMembershipSchema) }).parse(await client.get(`/v1/team/${teamId}/user`)).user_teams,
  );
  const roleId = members?.find((member) => member.user_id === user?.id)?.role_id ?? null;
  return useMemo(
    () => ({
      isAdmin: roleId === ADMIN_ROLE_ID || roleId === SUPERADMIN_ROLE_ID,
      isSuperAdmin: roleId === SUPERADMIN_ROLE_ID,
      roleId,
    }),
    [roleId],
  );
}

// --- Teams ---

const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: optionalText,
});
export type Team = z.infer<typeof TeamSchema>;

/** The server's own team, which every user is in and none works in. */
export const SYSTEM_TEAM_ID = 'FFFFFFFF-FFFF-FFFF-0000-FFFFFFFFFFFF';

/**
 * The signed-in user's teams, without the system team; nothing is asked without a session. The
 * active team is kept on one of them: a removed or missing one is replaced by the first.
 */
export function useTeams(): SWRResponse<Team[], Error> {
  const client = useClient();
  return useSWR<Team[], Error>(useHasSession() ? '/v1/team' : null, async () => {
    const teams = z
      .object({ teams: z.array(TeamSchema) })
      .parse(await client.get('/v1/team'))
      .teams.filter((team) => team.id !== SYSTEM_TEAM_ID);
    const active = teamToActivate(
      teams.map((team) => team.id),
      activeTeamId() ?? undefined,
    );
    if (active !== null) {
      setActiveTeam(active);
    }
    return teams;
  });
}

/**
 * One of the user's teams: `teamId`, or the active team when it is omitted. Undefined while the
 * teams load; null when the user isn't in it (or has no active team).
 */
export function useSelectedTeam(teamId?: string): Team | null | undefined {
  const { data: teams } = useTeams();
  if (teams === undefined) {
    return undefined;
  }
  const id = teamId === undefined || teamId === '' ? activeTeamId() : teamId;
  return teams.find((team) => team.id === id) ?? null;
}

export function useTeam(id?: string): SWRResponse<Team, Error> {
  const client = useClient();
  return useSWR<Team, Error>(
    id !== undefined && id !== '' ? `/v1/team/${id}` : null,
    async () => z.object({ team: TeamSchema }).parse(await client.get(`/v1/team/${id}`)).team,
  );
}

// --- Extensions (server-side) ---

const ServerExtensionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: optionalText,
});
export type ServerExtension = z.infer<typeof ServerExtensionSchema>;

/** Answers that mean "no server extensions here": signed out (401), or an API without the route (404). */
const NO_EXTENSIONS_STATUSES: ReadonlySet<number> = new Set([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.NOT_FOUND]);

/**
 * The extensions the server runs (GET /v1/extension, which needs a session). A signed-out visitor
 * sends nothing; a 401 or 404 reads as none.
 */
export function useServerExtensions(): SWRResponse<ServerExtension[], Error> {
  const client = useClient();
  return useSWR<ServerExtension[], Error>(useHasSession() ? '/v1/extension' : null, async () => {
    try {
      return z.object({ extensions: z.array(ServerExtensionSchema) }).parse(await client.get('/v1/extension')).extensions;
    } catch (error) {
      if (error instanceof ApiError && NO_EXTENSIONS_STATUSES.has(error.status)) {
        return [];
      }
      throw error;
    }
  });
}

// --- Providers ---

const ProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  friendly_name: optionalText,
});
export type Provider = z.infer<typeof ProviderSchema>;

export function useProviders(): SWRResponse<Provider[], Error> {
  const client = useClient();
  return useSWR<Provider[], Error>(
    '/v1/provider',
    async () => z.object({ providers: z.array(ProviderSchema) }).parse(await client.get('/v1/provider')).providers,
  );
}

// --- Notifications ---

const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  reference_type: optionalText,
  reference_id: optionalText,
  created_at: z.string(),
});

const UserNotificationSchema = z.object({
  id: z.string(),
  notification_id: z.string(),
  read: z.boolean(),
  acknowledged: z.boolean(),
});

/** One notification delivered to the signed-in user, with their read state. `id` is the delivery's id. */
export interface Notification {
  id: string;
  notificationId: string;
  title: string;
  content: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  read: boolean;
  acknowledged: boolean;
}

/** Join the user's deliveries (read state) to the notifications they deliver, newest first. */
export function toInbox(
  deliveries: readonly z.infer<typeof UserNotificationSchema>[],
  notifications: readonly z.infer<typeof NotificationSchema>[],
): Notification[] {
  const byId = new Map(notifications.map((notification) => [notification.id, notification]));
  return deliveries
    .flatMap((delivery) => {
      const notification = byId.get(delivery.notification_id);
      return notification === undefined
        ? []
        : [
            {
              id: delivery.id,
              notificationId: notification.id,
              title: notification.title,
              content: notification.content,
              referenceType: notification.reference_type ?? null,
              referenceId: notification.reference_id ?? null,
              createdAt: notification.created_at,
              read: delivery.read,
              acknowledged: delivery.acknowledged,
            },
          ];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The signed-in user's notification inbox (GET /v1/user-notifications joined to /v1/notifications). */
export function useNotifications(): SWRResponse<Notification[], Error> {
  const client = useClient();
  return useSWR<Notification[], Error>('/v1/user-notifications', async () => {
    const [deliveries, notifications] = await Promise.all([
      client.get('/v1/user-notifications'),
      client.get('/v1/notifications'),
    ]);
    return toInbox(
      z.object({ user_notifications: z.array(UserNotificationSchema) }).parse(deliveries).user_notifications,
      z.object({ notifications: z.array(NotificationSchema) }).parse(notifications).notifications,
    );
  });
}

/** Mark one delivered notification read (PATCH /v1/user-notifications/{id}/read). */
export function useMarkNotificationRead(): (deliveryId: string) => Promise<void> {
  const client = useClient();
  const { mutate } = useNotifications();
  return async (deliveryId: string): Promise<void> => {
    await client.patch(`/v1/user-notifications/${encodeURIComponent(deliveryId)}/read`, {});
    await mutate();
  };
}
