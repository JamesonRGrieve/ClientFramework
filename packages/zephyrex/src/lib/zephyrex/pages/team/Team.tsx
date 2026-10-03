'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { LuPencil, LuPlus } from 'react-icons/lu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../../../../components/ui/sidebar';
import { type ConflictField, ConflictPanel } from '../../components/ConflictPanel';
import { setActiveTeam } from '../../cookies';
import { type Team as TeamRecord, useSelectedTeam, useTeams } from '../../hooks';
import { useTeamAccess, useTeamActions } from './useTeamManagement';

/** Team names are short labels; the server's own limit. */
const MAX_TEAM_NAME_LENGTH = 20;

const RENAME_FIELDS: readonly ConflictField<TeamRecord>[] = [{ key: 'name', label: 'Team name' }];

const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

function TeamNameDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  initialName,
  teams,
  parentChoice,
  onSubmit,
  renderConflict,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  initialName: string;
  teams: TeamRecord[];
  /** Offer a parent team (creating only). */
  parentChoice: boolean;
  /** True once saved, which closes the dialog; false keeps it open (a conflict to resolve). */
  onSubmit: (name: string, parentId: string | undefined) => Promise<boolean>;
  /**
   * A refused save's conflict, shown in the dialog until it is resolved or discarded; it settles
   * its resolving write as a submit does.
   */
  renderConflict?: (settle: (saving: Promise<boolean>) => void) => ReactNode;
}): ReactElement {
  const nameId = useId();
  const parentId = useId();
  const [name, setName] = useState(initialName);
  const [parent, setParent] = useState('');
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const duplicate = teams.some((team) => sameName(team.name, name) && !sameName(name, initialName));

  // A save closes the dialog once written; a refusal as stale leaves it open on the conflict.
  const settle = (saving: Promise<boolean>): void => {
    setPending(true);
    void (async (): Promise<void> => {
      try {
        if (await saving) {
          onOpenChange(false);
        }
      } catch (error) {
        setProblem(error instanceof Error ? error.message : 'The team could not be saved.');
      } finally {
        setPending(false);
      }
    })();
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (name.trim() === '') {
      setProblem('Enter a team name.');
      return;
    }
    if (duplicate && !confirmedDuplicate) {
      setConfirmedDuplicate(true);
      return;
    }
    settle(onSubmit(name.trim(), parent === '' ? undefined : parent));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form className='grid gap-4' onSubmit={submit}>
          <div className='grid gap-2'>
            <Label htmlFor={nameId}>Team name</Label>
            <Input
              id={nameId}
              value={name}
              maxLength={MAX_TEAM_NAME_LENGTH}
              required
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setName(event.target.value);
                setConfirmedDuplicate(false);
                setProblem(null);
              }}
            />
          </div>
          {parentChoice && teams.length > 0 && (
            <div className='grid gap-2'>
              <Label htmlFor={parentId}>Parent team (optional)</Label>
              <select
                id={parentId}
                className='rounded-md border bg-background px-3 py-2 text-sm'
                value={parent}
                onChange={(event) => setParent(event.target.value)}
              >
                <option value=''>None</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {confirmedDuplicate && (
            <p role='status' className='rounded bg-yellow-100 px-2 py-2 text-xs text-yellow-800'>
              You already belong to a team with this name. Choose {submitLabel} again to use it anyway.
            </p>
          )}
          {renderConflict?.(settle)}
          {problem !== null && (
            <p role='alert' className='text-sm text-destructive'>
              {problem}
            </p>
          )}
          <DialogFooter>
            <Button variant='outline' type='button' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={pending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type TeamProps = {
  /** The team shown; the active team when omitted. */
  teamId?: string;
};

/** The team sidebar: switch the active team, rename it (admins), or create a new one. */
export function Team({ teamId }: TeamProps): ReactElement {
  const router = useRouter();
  const switcherId = useId();
  const { data: teams = [], mutate: refreshTeams } = useTeams();
  const selected = useSelectedTeam(teamId);
  const { admin } = useTeamAccess(selected?.id);
  const { createTeam, rename } = useTeamActions();
  const [dialog, setDialog] = useState<'create' | 'rename' | null>(null);

  const open = (teamIdToOpen: string): void => {
    setActiveTeam(teamIdToOpen);
    router.push(`/team/${encodeURIComponent(teamIdToOpen)}`);
  };

  return (
    <SidebarContent title='Team Management'>
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <label htmlFor={switcherId}>Team</label>
        </SidebarGroupLabel>
        <div className='w-full px-2 group-data-[collapsible=icon]:hidden'>
          <select
            id={switcherId}
            className='w-full rounded-md border bg-background px-3 py-2 text-sm'
            value={selected?.id ?? ''}
            disabled={teams.length === 0}
            onChange={(event) => open(event.target.value)}
          >
            {teams.length === 0 ? (
              <option value=''>No teams yet: create one</option>
            ) : (
              <>
                {selected === null && <option value=''>Choose a team</option>}
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        {(selected?.description ?? '') !== '' && (
          <p className='px-2 pt-2 text-sm text-muted-foreground'>{selected?.description}</p>
        )}
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Team functions</SidebarGroupLabel>
        <SidebarMenu>
          {admin && selected !== null && selected !== undefined && (
            <SidebarMenuItem>
              <SidebarMenuButton tooltip='Rename team' onClick={() => setDialog('rename')}>
                <LuPencil className='h-4 w-4' aria-hidden />
                <span>Rename team</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip='Create team' onClick={() => setDialog('create')}>
              <LuPlus className='h-4 w-4' aria-hidden />
              <span>Create team</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      {dialog === 'rename' && selected !== null && selected !== undefined && (
        <TeamNameDialog
          open
          onOpenChange={(isOpen) => {
            rename.discard();
            setDialog(isOpen ? 'rename' : null);
          }}
          title='Rename team'
          submitLabel='Rename'
          initialName={selected.name}
          teams={teams}
          parentChoice={false}
          onSubmit={async (name) => rename.save(selected, { name })}
          renderConflict={(settle) =>
            rename.conflict !== null && (
              <ConflictPanel
                conflict={rename.conflict}
                fields={RENAME_FIELDS}
                onResolve={(merged) => {
                  settle(rename.resolve(merged));
                }}
                onDiscard={rename.discard}
              />
            )
          }
        />
      )}
      {dialog === 'create' && (
        <TeamNameDialog
          open
          onOpenChange={(isOpen) => setDialog(isOpen ? 'create' : null)}
          title='Create team'
          submitLabel='Create'
          initialName=''
          teams={teams}
          parentChoice
          onSubmit={async (name, parentId) => {
            const created = await createTeam(name, parentId);
            await refreshTeams();
            open(created);
            return true;
          }}
        />
      )}
    </SidebarContent>
  );
}
