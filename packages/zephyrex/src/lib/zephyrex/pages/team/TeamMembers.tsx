'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, useId, useState } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { useSelectedTeam, useUser } from '../../hooks';
import { InviteForm } from './InviteForm';
import { inviteeStatus, inviteLink, type Membership, memberName, type Role, roleLabel } from './teamModel';
import { type InvitationWithInvitees, useTeamAccess, useTeamActions, useTeamInvitations } from './useTeamManagement';

/**
 * Remove a member, or leave the team from your own row, in two steps: the first press asks, the
 * second does it.
 */
function RemoveMember({
  name,
  isSelf,
  onRemove,
}: {
  name: string;
  isSelf: boolean;
  onRemove: () => Promise<void>;
}): ReactElement {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (!confirming) {
    return (
      <Button
        type='button'
        variant='outline'
        size='sm'
        aria-label={isSelf ? 'Leave the team' : `Remove ${name} from the team`}
        onClick={() => {
          setConfirming(true);
        }}
      >
        {isSelf ? 'Leave' : 'Remove'}
      </Button>
    );
  }
  return (
    <span className='flex items-center gap-2'>
      <Button
        type='button'
        variant='destructive'
        size='sm'
        disabled={pending}
        onClick={() => {
          setPending(true);
          void onRemove().finally(() => {
            setPending(false);
            setConfirming(false);
          });
        }}
      >
        {isSelf ? 'Yes, leave' : `Yes, remove ${name}`}
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        disabled={pending}
        onClick={() => {
          setConfirming(false);
        }}
      >
        Cancel
      </Button>
    </span>
  );
}

function MemberRow({
  member,
  isSelf,
  assignable,
  onChangeRole,
  onRemove,
}: {
  member: Membership;
  isSelf: boolean;
  /** Roles the viewer may give this member; empty when they can't change it. */
  assignable: Role[];
  onChangeRole: (member: Membership, roleId: string) => Promise<string | null>;
  onRemove: (member: Membership) => Promise<string | null>;
}): ReactElement {
  const selectId = useId();
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const name = memberName(member);
  // The server lets an admin act on members up to their own rank, and anyone leave; nobody changes
  // their own membership any other way.
  const canChange = !isSelf && assignable.some((option) => option.id === member.role_id);
  const canRemove = isSelf || canChange;

  return (
    <li className='flex flex-wrap items-center justify-between gap-2 p-4'>
      <div>
        <p className='font-medium'>
          {name}
          {isSelf && <span className='font-normal text-muted-foreground'> (you)</span>}
        </p>
        {(member.user.email ?? '') !== name && <p className='text-sm text-muted-foreground'>{member.user.email}</p>}
      </div>
      {canChange ? (
        <div className='flex items-center gap-2'>
          <Label htmlFor={selectId} className='sr-only'>
            Role for {name}
          </Label>
          <select
            id={selectId}
            className='rounded-md border bg-background px-2 py-1 text-sm'
            value={member.role_id}
            disabled={pending}
            onChange={(event) => {
              const roleId = event.target.value;
              setPending(true);
              void (async (): Promise<void> => {
                setProblem(await onChangeRole(member, roleId));
                setPending(false);
              })();
            }}
          >
            {assignable.map((option) => (
              <option key={option.id} value={option.id}>
                {roleLabel(option)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <Badge variant='outline'>{roleLabel(member.role)}</Badge>
      )}
      {canRemove && (
        <RemoveMember
          name={name}
          isSelf={isSelf}
          onRemove={async () => {
            setProblem(await onRemove(member));
          }}
        />
      )}
      {problem !== null && (
        <p role='alert' className='w-full text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

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
  onRevoke: (invitationId: string) => Promise<string | null>;
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
              const problem = await onRevoke(invitation.id);
              if (problem !== null) {
                setNotice({ text: problem, alert: true });
                setPending(false);
              }
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
                  Copy link<span className='sr-only'> for {invitee.email}</span>
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

function TeamInvitations({
  teamId,
  teamName,
  roles,
  assignable,
}: {
  teamId: string;
  teamName: string;
  roles: Role[];
  /** Roles the viewer may invite with. */
  assignable: Role[];
}): ReactElement {
  const invitations = useTeamInvitations(teamId);
  const { revokeInvitation } = useTeamActions();
  const rolesById = new Map(roles.map((role) => [role.id, role]));
  const open = (invitations.data ?? []).filter(({ invitees }) =>
    invitees.some((invitee) => inviteeStatus(invitee) === 'pending'),
  );

  const onRevoke = async (invitationId: string): Promise<string | null> => {
    try {
      await revokeInvitation(invitationId);
      await invitations.mutate();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'The invitation could not be revoked.';
    }
  };

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

export type TeamMembersProps = {
  /** The team to show; the active team when omitted. */
  teamId?: string;
};

/**
 * A team's members, and for its admins the role controls, pending invitations and the invite form.
 * What an admin may grant is capped at their own role, as the server enforces.
 */
export function TeamMembers({ teamId }: TeamMembersProps): ReactElement {
  const activeTeam = useSelectedTeam(teamId);
  const resolvedTeamId = teamId ?? activeTeam?.id;
  const { data: user } = useUser();
  const { members, roles, admin, assignable } = useTeamAccess(resolvedTeamId);
  const { changeRole, removeMember } = useTeamActions();

  if (resolvedTeamId === undefined || resolvedTeamId === '') {
    return <p className='text-sm text-muted-foreground'>Choose or create a team to manage its members.</p>;
  }

  const onChangeRole = async (member: Membership, roleId: string): Promise<string | null> => {
    try {
      await changeRole(resolvedTeamId, member.user_id, roleId);
      await members.mutate();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'The role could not be changed.';
    }
  };

  // A refusal (the team's last admin, or a member above the viewer) keeps the row and says why.
  const onRemove = async (member: Membership): Promise<string | null> => {
    try {
      await removeMember(resolvedTeamId, member.user_id);
      await members.mutate();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'The member could not be removed.';
    }
  };

  return (
    <div className='grid gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Members{activeTeam?.name === undefined ? '' : ` of ${activeTeam.name}`}</CardTitle>
          <CardDescription>
            {admin
              ? 'Everyone on this team. You can change or remove members up to your own role.'
              : 'Everyone on this team.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The members could not be loaded: {members.error.message}
            </p>
          )}
          {members.error === undefined && (members.data ?? []).length === 0 && (
            <p className='text-sm text-muted-foreground'>{members.isLoading ? 'Loading…' : 'This team has no members.'}</p>
          )}
          {(members.data ?? []).length > 0 && (
            <ul aria-label='Team members' className='divide-y rounded-md border'>
              {(members.data ?? []).map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isSelf={member.user_id === user?.id}
                  assignable={assignable}
                  onChangeRole={onChangeRole}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {admin && (
        <TeamInvitations teamId={resolvedTeamId} teamName={activeTeam?.name ?? ''} roles={roles} assignable={assignable} />
      )}
    </div>
  );
}
