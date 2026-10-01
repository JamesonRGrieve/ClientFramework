// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { setActiveTeam, useClient } from 'zephyrex';
import {
  type InvitationAnswer,
  invitationAnswer,
  type PendingInvitation,
  PendingInvitationsResponseSchema,
} from './invitationsModel';

export const USER_INVITATIONS_ENDPOINT = '/v1/user/invitation';

export interface UserInvitations {
  invitations: SWRResponse<PendingInvitation[], Error>;
  /** Accept or decline; resolves once the server has recorded the answer. */
  answer: (invitation: PendingInvitation, action: InvitationAnswer) => Promise<void>;
}

/** Invitations awaiting the signed-in user's answer, and answering them. */
export function useUserInvitations(): UserInvitations {
  const client = useClient();
  const invitations = useSWR<PendingInvitation[], Error>(
    client.url(USER_INVITATIONS_ENDPOINT),
    async () => PendingInvitationsResponseSchema.parse(await client.get(USER_INVITATIONS_ENDPOINT)).invitations,
  );
  const { mutate } = invitations;

  const answer = useCallback(
    async (invitation: PendingInvitation, action: InvitationAnswer): Promise<void> => {
      await client.patch(`/v1/invitation/${encodeURIComponent(invitation.id)}`, invitationAnswer(invitation, action));
      // Joining a team puts the user in it, as choosing it in the team switcher would.
      const teamId = invitation.team_id ?? '';
      if (action === 'accept' && teamId !== '') {
        setActiveTeam(teamId);
      }
      await mutate();
    },
    [client, mutate],
  );

  return { invitations, answer };
}
