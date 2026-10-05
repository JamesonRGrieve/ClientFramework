// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { z } from 'zod';
import { type Team, TeamSchema, useClient, useTeams, useUser } from '../../hooks';
import { type GuardedSave, useGuardedSave } from '../../useGuardedSave';
import {
  invitableRoles,
  isTeamAdmin,
  type Membership,
  MembershipSchema,
  MembershipsResponseSchema,
  type Person,
  personName,
  type Role,
  RoleSchema,
} from './teamModel';

const segment = encodeURIComponent;

const membersPath = (teamId: string): string => `/v1/team/${segment(teamId)}/user`;
const memberPath = (member: Membership): string => `${membersPath(member.team_id)}/${segment(member.user_id)}`;
const ROLES_PATH = '/v1/role';

/** The team's memberships, each with its user and role. */
export function useTeamMembers(teamId: string | undefined): SWRResponse<Membership[], Error> {
  const client = useClient();
  return useSWR<Membership[], Error>(
    teamId === undefined || teamId === '' ? null : client.url(membersPath(teamId)),
    async () => MembershipsResponseSchema.parse(await client.get(membersPath(teamId ?? ''))).user_teams,
  );
}

/**
 * The people the signed-in user shares a team with, once each, by name and without the user: the
 * users the server lets them see, so the ones they can message or add to a conversation.
 */
export function useTeammates(): SWRResponse<Person[], Error> {
  const client = useClient();
  const { data: user } = useUser();
  const { data: teams } = useTeams();
  const teamIds = (teams ?? []).map(({ id }) => id);
  return useSWR<Person[], Error>(
    user === undefined || teams === undefined ? null : ['teammates', user.id, ...teamIds],
    async () => {
      const memberships = await Promise.all(
        teamIds.map(async (teamId) => MembershipsResponseSchema.parse(await client.get(membersPath(teamId))).user_teams),
      );
      const people = new Map<string, Person>();
      for (const { user: person } of memberships.flat()) {
        if (person.id !== user?.id) {
          people.set(person.id, person);
        }
      }
      return [...people.values()].sort((a, b) => personName(a).localeCompare(personName(b)));
    },
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
  /** Create a team; resolves to its id. Callers revalidate what they show. */
  createTeam: (name: string, parentId?: string) => Promise<string>;
  /** Rename a team: `rename.save(team, { name })`, guarded by the team as loaded. */
  rename: GuardedSave<Team>;
}

/** The team writes. A rename refreshes the user's teams. */
export function useTeamActions(): TeamActions {
  const client = useClient();
  const { mutate: refreshTeams } = useTeams();
  const createTeam = useCallback(
    async (name: string, parentId?: string): Promise<string> =>
      CreatedTeamSchema.parse(
        await client.post('/v1/team', { team: { name, ...(parentId === undefined ? {} : { parent_id: parentId }) } }),
      ).team.id,
    [client],
  );
  const renameTeam = useCallback(
    async (seen: Team, changes: Partial<Team>): Promise<void> => {
      await client.put(`/v1/team/${segment(seen.id)}`, { team: { name: changes.name } }, seen);
      await refreshTeams();
    },
    [client, refreshTeams],
  );
  return { createTeam, rename: useGuardedSave(renameTeam, TeamSchema) };
}

export interface MembershipActions {
  /** Give a member another role: `changeRole.save(member, { role_id })`. */
  changeRole: GuardedSave<Membership>;
  /**
   * Remove a member, or leave the team from your own membership: `remove.save(member, {})`. The
   * team's last admin cannot go (409).
   */
  remove: GuardedSave<Membership>;
}

/** The writes to one of `teamId`'s memberships, each guarded by it as loaded; both refresh the members. */
export function useMembershipActions(teamId: string): MembershipActions {
  const client = useClient();
  const { mutate: refreshMembers } = useTeamMembers(teamId);
  const changeRole = useCallback(
    async (seen: Membership, changes: Partial<Membership>): Promise<void> => {
      await client.patch(memberPath(seen), { user_team: { role_id: changes.role_id } }, seen);
      await refreshMembers();
    },
    [client, refreshMembers],
  );
  const remove = useCallback(
    async (seen: Membership): Promise<void> => {
      await client.delete(memberPath(seen), seen);
      await refreshMembers();
    },
    [client, refreshMembers],
  );
  return {
    changeRole: useGuardedSave(changeRole, MembershipSchema),
    remove: useGuardedSave(remove, MembershipSchema),
  };
}
