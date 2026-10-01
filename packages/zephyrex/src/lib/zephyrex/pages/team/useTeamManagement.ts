// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { z } from 'zod';
import { useClient, useUser } from '../../hooks';
import { invitableRoles, isTeamAdmin, type Membership, MembershipsResponseSchema, type Role, RoleSchema } from './teamModel';

const segment = encodeURIComponent;

const membersPath = (teamId: string): string => `/v1/team/${segment(teamId)}/user`;
const ROLES_PATH = '/v1/role';

/** The team's memberships, each with its user and role. */
export function useTeamMembers(teamId: string | undefined): SWRResponse<Membership[], Error> {
  const client = useClient();
  return useSWR<Membership[], Error>(
    teamId === undefined || teamId === '' ? null : client.url(membersPath(teamId)),
    async () => MembershipsResponseSchema.parse(await client.get(membersPath(teamId ?? ''))).user_teams,
  );
}

/** Every role the signed-in user can see: the system roles and their teams' own. */
export function useRoles(): SWRResponse<Role[], Error> {
  const client = useClient();
  return useSWR<Role[], Error>(client.url(ROLES_PATH), async () => client.list(ROLES_PATH, 'roles', RoleSchema));
}

export interface TeamAccess {
  members: SWRResponse<Membership[], Error>;
  roles: Role[];
  /** The viewer's own role on the team, once their membership has loaded. */
  ownRoleId: string | undefined;
  /** Whether the viewer is an admin (or higher) of the team. */
  admin: boolean;
  /** The roles the viewer may grant on the team; empty unless they are an admin. */
  assignable: Role[];
}

/** What the signed-in user may do on `teamId`, from their membership and the role hierarchy. */
export function useTeamAccess(teamId: string | undefined): TeamAccess {
  const { data: user } = useUser();
  const members = useTeamMembers(teamId);
  const { data: roles = [] } = useRoles();
  const ownRoleId = (members.data ?? []).find((member) => member.user_id === user?.id)?.role_id;
  const admin = isTeamAdmin(roles, ownRoleId);
  return {
    members,
    roles,
    ownRoleId,
    admin,
    assignable: admin && teamId !== undefined ? invitableRoles(roles, ownRoleId, teamId) : [],
  };
}

const CreatedTeamSchema = z.object({ team: z.object({ id: z.string() }) });

export interface TeamActions {
  /** Create a team; resolves to its id. */
  createTeam: (name: string, parentId?: string) => Promise<string>;
  renameTeam: (teamId: string, name: string) => Promise<void>;
  changeRole: (teamId: string, userId: string, roleId: string) => Promise<void>;
  /** Remove a member; given your own id, leave the team. The team's last admin cannot go (409). */
  removeMember: (teamId: string, userId: string) => Promise<void>;
}

/** The team management writes. Callers revalidate what they show. */
export function useTeamActions(): TeamActions {
  const client = useClient();
  const memberPath = (teamId: string, userId: string): string => `${membersPath(teamId)}/${segment(userId)}`;
  return {
    createTeam: async (name, parentId) =>
      CreatedTeamSchema.parse(
        await client.post('/v1/team', { team: { name, ...(parentId === undefined ? {} : { parent_id: parentId }) } }),
      ).team.id,
    renameTeam: async (teamId, name): Promise<void> => {
      await client.put(`/v1/team/${segment(teamId)}`, { team: { name } });
    },
    changeRole: async (teamId, userId, roleId): Promise<void> => {
      await client.patch(memberPath(teamId, userId), { user_team: { role_id: roleId } });
    },
    removeMember: async (teamId, userId): Promise<void> => {
      await client.delete(memberPath(teamId, userId));
    },
  };
}
