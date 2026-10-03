'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ComponentType, type ReactElement, useId, useState } from 'react';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { type ConflictField, ConflictPanel } from '../../components/ConflictPanel';
import { useActiveExtensions } from '../../ExtensionRegistry';
import { useSelectedTeam, useUser } from '../../hooks';
import type { TeamSectionProps, ZephyrexClientExtension } from '../../types';
import { writeProblem } from '../../useGuardedSave';
import { useZephyrexConfig } from '../../ZephyrexProvider';
import { type Membership, memberName, type Role, roleLabel } from './teamModel';
import { useMembershipActions, useTeamAccess } from './useTeamManagement';

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

const ROLE_FAILURE = 'The role could not be changed.';
const REMOVE_FAILURE = 'The member could not be removed.';

function MemberRow({
  member,
  isSelf,
  assignable,
  roles,
}: {
  member: Membership;
  isSelf: boolean;
  /** Roles the viewer may give this member; empty when they can't change it. */
  assignable: Role[];
  /** Every role the viewer can see, to name a role in a conflict. */
  roles: Role[];
}): ReactElement {
  const selectId = useId();
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { changeRole, remove } = useMembershipActions(member.team_id);
  const name = memberName(member);
  const roleField: ConflictField<Membership> = {
    key: 'role_id',
    label: `Role for ${name}`,
    format: ({ role_id: roleId = '' }) => {
      const role = roles.find((candidate) => candidate.id === roleId);
      return role === undefined ? roleId : roleLabel(role);
    },
  };

  // A refusal (the team's last admin, or a member above the viewer) keeps the row and says why.
  const run = async (writing: Promise<boolean>, failure: string): Promise<void> => {
    setProblem(await writeProblem(writing, failure));
  };
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
              setPending(true);
              void run(changeRole.save(member, { role_id: event.target.value }), ROLE_FAILURE).finally(() => {
                setPending(false);
              });
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
        <RemoveMember name={name} isSelf={isSelf} onRemove={async () => run(remove.save(member, {}), REMOVE_FAILURE)} />
      )}
      {changeRole.conflict !== null && (
        <div className='w-full'>
          <ConflictPanel
            conflict={changeRole.conflict}
            fields={[roleField]}
            onResolve={(merged) => {
              void run(changeRole.resolve(merged), ROLE_FAILURE);
            }}
            onDiscard={changeRole.discard}
          />
        </div>
      )}
      {remove.conflict !== null && (
        <div className='w-full'>
          <ConflictPanel
            conflict={remove.conflict}
            fields={[]}
            applyLabel={isSelf ? 'Leave anyway' : `Remove ${name} anyway`}
            onResolve={(merged) => {
              void run(remove.resolve(merged), REMOVE_FAILURE);
            }}
            onDiscard={remove.discard}
          />
        </div>
      )}
      {problem !== null && (
        <p role='alert' className='w-full text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** The active extensions' team sections in extension order, each keyed by its extension. */
function teamSections(
  extensions: readonly ZephyrexClientExtension[],
): { key: string; Section: ComponentType<TeamSectionProps> }[] {
  return extensions.flatMap(({ name, teamSections: sections = [] }) =>
    sections.map((Section, index) => ({ key: `${name}-${String(index)}`, Section })),
  );
}

export type TeamMembersProps = {
  /** The team to show; the active team when omitted. */
  teamId?: string;
};

/**
 * A team's members, the role controls for its admins, and below them the active extensions' team
 * sections (`teamSections`). What an admin may grant is capped at their own role, as the server enforces.
 */
export function TeamMembers({ teamId }: TeamMembersProps): ReactElement {
  const activeTeam = useSelectedTeam(teamId);
  const resolvedTeamId = teamId ?? activeTeam?.id;
  const { data: user } = useUser();
  const { members, roles, admin, assignable } = useTeamAccess(resolvedTeamId);
  const { active } = useActiveExtensions(useZephyrexConfig().activeExtensions);
  const sections = teamSections(active);

  if (resolvedTeamId === undefined || resolvedTeamId === '') {
    return <p className='text-sm text-muted-foreground'>Choose or create a team to manage its members.</p>;
  }

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
                  roles={roles}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {sections.map(({ key, Section }) => (
        <Section
          key={key}
          teamId={resolvedTeamId}
          teamName={activeTeam?.name ?? ''}
          admin={admin}
          roles={roles}
          assignable={assignable}
        />
      ))}
    </div>
  );
}
