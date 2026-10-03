'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, useState } from 'react';
import { ConflictPanel, type TeamSectionProps, writeProblem } from 'zephyrex';
import { type Role, roleLabel } from 'zephyrex/pages/team';
import { Badge } from 'zephyrex/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { InviteForm } from './InviteForm';
import { inviteeStatus, inviteLink, type TeamInvitation } from './teamInvitationsModel';
import { type InvitationWithInvitees, useInvitationActions, useTeamInvitations } from './useTeamInvitations';

function InvitationRow({
  entry: { invitation, invitees },
  role,
  teamName,
  onRevoke,
}: {
  entry: InvitationWithInvitees;
  role: Role | undefined;
  /** Named in the copied link, so the invitee's acceptance page says which team. */
  teamName: string;
  onRevoke: (invitation: TeamInvitation) => Promise<string | null>;
}): ReactElement {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);
  const code = invitation.code ?? '';
  const sent = new Date(invitation.created_at).toLocaleDateString();

  const copyLink = (email: string): void => {
    void (async (): Promise<void> => {
      try {
        await navigator.clipboard.writeText(inviteLink(window.location.origin, code, email, teamName));
        setNotice({ text: `Copied the invite link for ${email}.`, alert: false });
      } catch (error) {
        setNotice({ text: error instanceof Error ? error.message : 'The link could not be copied.', alert: true });
      }
    })();
  };

  return (
    <li className='grid gap-2 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm'>
          <span className='font-medium'>{roleLabel(role)}</span>
          <span className='text-muted-foreground'> · sent {sent}</span>
        </p>
        <Button
          size='sm'
          variant='outline'
          disabled={pending}
          aria-label={`Revoke the invitation sent ${sent}`}
          onClick={() => {
            setPending(true);
            void (async (): Promise<void> => {
              const problem = await onRevoke(invitation);
              if (problem !== null) {
                setNotice({ text: problem, alert: true });
              }
              setPending(false);
            })();
          }}
        >
          Revoke
        </Button>
      </div>
      <ul className='grid gap-1'>
        {invitees.map((invitee) => {
          const status = inviteeStatus(invitee);
          return (
            <li key={invitee.id} className='flex flex-wrap items-center gap-2 text-sm'>
              <span>{invitee.email}</span>
              <Badge variant={status === 'accepted' ? 'default' : 'secondary'}>{status}</Badge>
              {status === 'pending' && code !== '' && (
                <Button size='sm' variant='ghost' onClick={() => copyLink(invitee.email)}>
                  Copy link <span className='sr-only'>for {invitee.email}</span>
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {notice !== null && (
        <p role={notice.alert ? 'alert' : 'status'} className={notice.alert ? 'text-sm text-destructive' : 'text-sm'}>
          {notice.text}
        </p>
      )}
    </li>
  );
}

function AdminInvitations({ teamId, teamName, roles, assignable }: Omit<TeamSectionProps, 'admin'>): ReactElement {
  const invitations = useTeamInvitations(teamId);
  const { revoke } = useInvitationActions();
  const [problem, setProblem] = useState<string | null>(null);
  const rolesById = new Map(roles.map((role) => [role.id, role]));
  const open = (invitations.data ?? []).filter(({ invitees }) =>
    invitees.some((invitee) => inviteeStatus(invitee) === 'pending'),
  );

  // A revoke refused because the invitation changed first shows its conflict above the list.
  const refreshOnceRevoked = async (revoking: Promise<boolean>): Promise<void> => {
    if (await revoking) {
      await invitations.mutate();
    }
  };
  const settle = async (revoking: Promise<boolean>): Promise<string | null> =>
    writeProblem(refreshOnceRevoked(revoking), 'The invitation could not be revoked.');
  const onRevoke = async (invitation: TeamInvitation): Promise<string | null> => settle(revoke.save(invitation, {}));

  return (
    <>
      <InviteForm
        teamId={teamId}
        roles={assignable}
        onInvited={async () => {
          await invitations.mutate();
        }}
      />
      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
          <CardDescription>Invitations into this team that are still waiting for an answer.</CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The invitations could not be loaded: {invitations.error.message}
            </p>
          )}
          {revoke.conflict !== null && (
            <ConflictPanel
              conflict={revoke.conflict}
              fields={[]}
              applyLabel='Revoke anyway'
              onResolve={(merged) => {
                void settle(revoke.resolve(merged)).then(setProblem);
              }}
              onDiscard={revoke.discard}
            />
          )}
          {problem !== null && (
            <p role='alert' className='text-sm text-destructive'>
              {problem}
            </p>
          )}
          {invitations.error === undefined && open.length === 0 && (
            <p className='text-sm text-muted-foreground'>{invitations.isLoading ? 'Loading…' : 'No pending invitations.'}</p>
          )}
          {open.length > 0 && (
            <ul aria-label='Pending team invitations' className='divide-y rounded-md border'>
              {open.map((entry) => (
                <InvitationRow
                  key={entry.invitation.id}
                  entry={entry}
                  role={rolesById.get(entry.invitation.role_id ?? '')}
                  teamName={teamName}
                  onRevoke={onRevoke}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/**
 * The team page's invitations section: for the team's admins, the invite form and the invitations
 * still awaiting an answer, each revocable and with a copyable link. Nothing for other members.
 */
export function TeamInvitations({ admin, ...team }: TeamSectionProps): ReactElement | null {
  return admin ? <AdminInvitations {...team} /> : null;
}
