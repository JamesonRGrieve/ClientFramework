// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { type GuardedSave, setActiveTeam, useClient, useGuardedSave } from 'zephyrex';
import {
  type AnswerableInvitation,
  AnswerableInvitationSchema,
  invitationAnswer,
  type PendingInvitation,
  PendingInvitationsResponseSchema,
} from './invitationsModel';

export const USER_INVITATIONS_ENDPOINT = '/v1/user/invitation';

export interface UserInvitations {
  invitations: SWRResponse<PendingInvitation[], Error>;
  /**
   * Accept or decline: `answer.save(invitation, { answer: 'accept' })`, guarded by the invitation
   * as loaded. Answering refreshes the invitations.
   */
  answer: GuardedSave<AnswerableInvitation>;
}

/** Invitations awaiting the signed-in user's answer, and answering them. */
export function useUserInvitations(): UserInvitations {
  const client = useClient();
  const invitations = useSWR<PendingInvitation[], Error>(
    client.url(USER_INVITATIONS_ENDPOINT),
    async () => PendingInvitationsResponseSchema.parse(await client.get(USER_INVITATIONS_ENDPOINT)).invitations,
  );
  const { mutate } = invitations;

  const write = useCallback(
    async (seen: AnswerableInvitation, changes: Partial<AnswerableInvitation>): Promise<void> => {
      const action = changes.answer;
      if (action === undefined) {
        throw new Error('Choose to accept or decline the invitation.');
      }
      await client.patch(`/v1/invitation/${encodeURIComponent(seen.id)}`, invitationAnswer(seen, action), seen);
      // Joining a team puts the user in it, as choosing it in the team switcher would.
      const teamId = seen.team_id ?? '';
      if (action === 'accept' && teamId !== '') {
        setActiveTeam(teamId);
      }
      await mutate();
    },
    [client, mutate],
  );

  return { invitations, answer: useGuardedSave(write, AnswerableInvitationSchema) };
}
