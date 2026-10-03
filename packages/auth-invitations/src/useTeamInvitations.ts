// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { type GuardedSave, useClient, useGuardedSave } from 'zephyrex';
import { z } from 'zod';
import { type Invitee, InviteeSchema, type TeamInvitation, TeamInvitationSchema } from './teamInvitationsModel';

export interface InvitationWithInvitees {
  invitation: TeamInvitation;
  invitees: Invitee[];
}

const invitationsPath = (teamId: string): string => `/v1/team/${encodeURIComponent(teamId)}/invitation`;

const InvitationWithInviteesSchema = TeamInvitationSchema.extend({ invitees: z.array(InviteeSchema).default([]) });

/** Every invitation into the team (all pages), each with who it went to, in one request per page. */
export function useTeamInvitations(teamId: string | undefined): SWRResponse<InvitationWithInvitees[], Error> {
  const client = useClient();
  const params = { include: 'invitees' };
  return useSWR<InvitationWithInvitees[], Error>(
    teamId === undefined || teamId === '' ? null : client.url(invitationsPath(teamId), params),
    async () =>
      (await client.list(invitationsPath(teamId ?? ''), 'invitations', InvitationWithInviteesSchema, params)).map(
        ({ invitees, ...invitation }) => ({ invitation, invitees }),
      ),
  );
}

export interface InvitationActions {
  /** Invite `emails` into the team with `roleId`; the server emails each address its link. */
  invite: (teamId: string, roleId: string, emails: string[]) => Promise<void>;
  /** `revoke.save(invitation, {})`, guarded by the invitation as loaded. */
  revoke: GuardedSave<TeamInvitation>;
}

/** The invitation writes. Callers revalidate what they show. */
export function useInvitationActions(): InvitationActions {
  const client = useClient();
  const invite = useCallback(
    async (teamId: string, roleId: string, emails: string[]): Promise<void> => {
      await client.post(invitationsPath(teamId), { invitation: { role_id: roleId, email: emails } });
    },
    [client],
  );
  const revoke = useCallback(
    async (seen: TeamInvitation): Promise<void> => {
      await client.delete(`/v1/invitation/${encodeURIComponent(seen.id)}`, seen);
    },
    [client],
  );
  return { invite, revoke: useGuardedSave(revoke, TeamInvitationSchema) };
}
