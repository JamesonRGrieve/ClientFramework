'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import type { InvitationAnswer, PendingInvitation } from './invitationsModel';
import { useUserInvitations } from './useUserInvitations';

const formatExpiry = (expiresAt: string | null | undefined): string =>
  expiresAt === null || expiresAt === undefined ? 'Does not expire' : `Expires ${new Date(expiresAt).toLocaleString()}`;

function InvitationRow({
  invitation,
  onAnswer,
}: {
  invitation: PendingInvitation;
  onAnswer: (invitation: PendingInvitation, action: InvitationAnswer) => Promise<string | null>;
}): ReactElement {
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const team = invitation.team?.name ?? 'A team';

  const answer = (action: InvitationAnswer): void => {
    setPending(true);
    void (async (): Promise<void> => {
      setProblem(await onAnswer(invitation, action));
      setPending(false);
    })();
  };

  return (
    <li className='grid gap-2 p-4'>
      <div>
        <p className='font-medium'>
          {team}
          {invitation.role !== null && invitation.role !== undefined && (
            <span className='font-normal text-muted-foreground'> as {invitation.role.name}</span>
          )}
        </p>
        <p className='text-sm text-muted-foreground'>{formatExpiry(invitation.expires_at)}</p>
      </div>
      <div className='flex gap-2'>
        <Button
          size='sm'
          disabled={pending}
          aria-label={`Accept the invitation to ${team}`}
          onClick={() => answer('accept')}
        >
          Accept
        </Button>
        <Button
          size='sm'
          variant='outline'
          disabled={pending}
          aria-label={`Decline the invitation to ${team}`}
          onClick={() => answer('decline')}
        >
          Decline
        </Button>
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** Team invitations awaiting the signed-in user's answer. */
export function PendingInvitations(): ReactElement {
  const { invitations, answer } = useUserInvitations();

  const onAnswer = async (invitation: PendingInvitation, action: InvitationAnswer): Promise<string | null> => {
    try {
      await answer(invitation, action);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'The invitation could not be answered.';
    }
  };

  const items = invitations.data ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
        <CardDescription>Teams that have invited you to join.</CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            Your invitations could not be loaded: {invitations.error.message}
          </p>
        )}
        {invitations.error === undefined && items.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            {invitations.isLoading ? 'Loading…' : 'You have no pending invitations.'}
          </p>
        )}
        {items.length > 0 && (
          <ul aria-label='Pending invitations' className='divide-y rounded-md border'>
            {items.map((invitation) => (
              <InvitationRow key={invitation.id} invitation={invitation} onAnswer={onAnswer} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
