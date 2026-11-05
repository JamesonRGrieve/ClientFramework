// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { type ReactElement, type SyntheticEvent, useCallback, useId, useState } from 'react';
import { useSWRConfig } from 'swr';
import { ConflictPanel, useClient, useGuardedSave, useUser, writeProblem } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import {
  ACQUAINTANCE_KINDS,
  ANCESTRY_ROLES,
  FRIENDSHIP_KINDS,
  genealogyApi,
  PERSON_ENDPOINT,
  MENTORSHIP_ROLES,
  PARTNERSHIP_KINDS,
  type Person,
  type Relationship,
  type RelationshipFields,
  RelationshipSchema,
  SIBLING_KINDS,
  useRelationships,
} from './genealogyApi';
import { personName } from './people';
import type { AppTie } from './options';
import {
  appTieFor,
  hasEnded,
  type RelationshipLine,
  relationshipFor,
  relationshipLines,
  type RelativeRole,
} from './relationships';
import { personPath } from './routes';
import { useGenealogyOptions } from './OptionsProvider';

const ROLE_CHOICES: { value: RelativeRole; label: string }[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'partner', label: 'Partner' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'acquaintance', label: 'Acquaintance' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'student', label: 'Student' },
];

/** The details a role can carry: a parent's role for ancestry, or the subkind of a symmetric tie. */
const DETAILS: Record<RelativeRole, readonly string[]> = {
  parent: ANCESTRY_ROLES,
  child: ANCESTRY_ROLES,
  partner: PARTNERSHIP_KINDS,
  sibling: SIBLING_KINDS,
  friend: FRIENDSHIP_KINDS,
  acquaintance: ACQUAINTANCE_KINDS,
  mentor: MENTORSHIP_ROLES,
  student: MENTORSHIP_ROLES,
};

const humanize = (value: string): string => value.replaceAll('_', ' ');

/** The family-history roles, which an app without lineage does not offer. */
const LINEAGE_ROLES = new Set<RelativeRole>(['parent', 'child']);

/** One choice of what the relative is: its subkinds, and the row it stores. */
interface RoleChoice {
  value: string;
  label: string;
  details: readonly string[];
  detailLabel: string;
  fields: (personId: string, relativeId: string, detail: string | null) => RelationshipFields;
}

/** The framework's roles (without parent and child when `lineage` is off), then each app tie from both ends. */
function roleChoices(lineage: boolean, ties: readonly AppTie[]): RoleChoice[] {
  const builtIn = ROLE_CHOICES.filter((choice) => lineage || !LINEAGE_ROLES.has(choice.value)).map((choice): RoleChoice => ({
    value: choice.value,
    label: choice.label,
    details: DETAILS[choice.value],
    detailLabel: LINEAGE_ROLES.has(choice.value) ? 'Parent’s role' : 'Kind',
    fields: (personId, relativeId, detail) => relationshipFor(personId, relativeId, choice.value, detail),
  }));
  const added = ties.flatMap((tie): RoleChoice[] => [
    {
      value: `${tie.kind}:object`,
      label: tie.objectRelative,
      details: tie.details,
      detailLabel: tie.detailLabel,
      fields: (personId, relativeId, detail) => appTieFor(personId, relativeId, tie, true, detail),
    },
    {
      value: `${tie.kind}:subject`,
      label: tie.subjectRelative,
      details: tie.details,
      detailLabel: tie.detailLabel,
      fields: (personId, relativeId, detail) => appTieFor(personId, relativeId, tie, false, detail),
    },
  ]);
  return [...builtIn, ...added];
}

const SELECT_CLASS = 'h-9 rounded-md border bg-background px-3 text-sm';

/** " (dating)", " (dating, ended)", " (ended)" or nothing, after a line's role. */
function lineDetail(line: RelationshipLine): string {
  const parts = [...(line.detail === null ? [] : [humanize(line.detail)]), ...(hasEnded(line, new Date()) ? ['ended'] : [])];
  return parts.length === 0 ? '' : ` (${parts.join(', ')})`;
}

/** The "Who" choice that adds someone not yet recorded, named in the form. */
const SOMEONE_NEW = '__new';

/**
 * A form tying `person` to someone: one already recorded, or someone new, added by name and tied
 * in the same step, so nobody has to leave the page to record a person first.
 */
export function AddRelative({
  person,
  people,
  onAdded,
}: {
  person: Person;
  people: Person[];
  onAdded: () => Promise<void>;
}): ReactElement {
  const ids = { role: useId(), relative: useId(), newName: useId(), detail: useId(), since: useId() };
  const client = useClient();
  const { data: user } = useUser();
  const yours = user !== undefined && person.linked_user_id === user.id;
  // A family tree starts from parents; an app without lineage, from partners.
  const { lineage, ties = [] } = useGenealogyOptions();
  const choices = roleChoices(lineage, ties);
  const [role, setRole] = useState<string>(lineage ? 'parent' : 'partner');
  const others = people.filter((candidate) => candidate.id !== person.id);
  // Nobody else recorded yet: the only choice is someone new.
  const [relativeId, setRelativeId] = useState(others.length === 0 ? SOMEONE_NEW : '');
  const [newName, setNewName] = useState('');
  const [detail, setDetail] = useState('');
  // When the tie began (YYYY-MM-DD), for anniversaries; optional.
  const [since, setSince] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const chosen = choices.find((choice) => choice.value === role) ?? choices.at(0);
  const details = chosen?.details ?? [];

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (relativeId === '' || chosen === undefined) {
      setProblem(lineage ? 'Choose who the relative is.' : 'Choose who they are.');
      return;
    }
    const name = newName.trim();
    if (relativeId === SOMEONE_NEW && name === '') {
      setProblem('Give their name.');
      return;
    }
    void (async (): Promise<void> => {
      try {
        const targetId = relativeId === SOMEONE_NEW ? (await genealogyApi.createPerson(client, { name })).id : relativeId;
        await genealogyApi.createRelationship(client, {
          ...chosen.fields(person.id, targetId, detail === '' ? null : detail),
          ...(since === '' || LINEAGE_ROLES.has(role as RelativeRole) ? {} : { valid_from: `${since}T00:00:00` }),
        });
        setRelativeId(SOMEONE_NEW);
        setNewName('');
        setSince('');
        setProblem(null);
        await onAdded();
      } catch (error) {
        setProblem(error instanceof Error ? error.message : 'The relationship could not be recorded.');
      }
    })();
  };

  return (
    <form className='grid gap-3' onSubmit={submit}>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-4'>
        <div className='grid gap-1'>
          <Label htmlFor={ids.relative}>{lineage ? 'Relative' : 'Who'}</Label>
          <select
            id={ids.relative}
            value={relativeId}
            onChange={(event) => setRelativeId(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value=''>Choose someone…</option>
            <option value={SOMEONE_NEW}>Someone new…</option>
            {others.map((other) => (
              <option key={other.id} value={other.id}>
                {personName(other)}
              </option>
            ))}
          </select>
        </div>
        {relativeId === SOMEONE_NEW && (
          <div className='grid gap-1'>
            <Label htmlFor={ids.newName}>Their name</Label>
            <Input id={ids.newName} value={newName} onChange={(event) => setNewName(event.target.value)} />
          </div>
        )}
        <div className='grid gap-1'>
          <Label htmlFor={ids.role}>{yours ? 'Is your' : `Is ${personName(person)}’s`}</Label>
          <select
            id={ids.role}
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setDetail('');
            }}
            className={SELECT_CLASS}
          >
            {choices.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
        {details.length > 0 && (
          <div className='grid gap-1'>
            <Label htmlFor={ids.detail}>{chosen?.detailLabel}</Label>
            <select
              id={ids.detail}
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value=''>Not recorded</option>
              {details.map((value) => (
                <option key={value} value={value}>
                  {humanize(value)}
                </option>
              ))}
            </select>
          </div>
        )}
        {!LINEAGE_ROLES.has(role as RelativeRole) && (
          <div className='grid gap-1'>
            <Label htmlFor={ids.since}>Since</Label>
            <input
              id={ids.since}
              type='date'
              value={since}
              onChange={(event) => setSince(event.target.value)}
              className={SELECT_CLASS}
            />
          </div>
        )}
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
      <div>
        <Button type='submit'>{lineage ? 'Add relative' : 'Add connection'}</Button>
      </div>
    </form>
  );
}

function RelativeRow({
  line,
  relative,
  onRemoved,
}: {
  line: RelationshipLine;
  relative: Person | undefined;
  /** Refreshes the relationships once the line's rows are gone. */
  onRemoved: () => Promise<void>;
}): ReactElement {
  const client = useClient();
  const [problem, setProblem] = useState<string | null>(null);
  // The rows still to delete after the one a conflict stopped on.
  const [rest, setRest] = useState<Relationship[]>([]);
  const remove = useGuardedSave(
    useCallback(async (seen: Relationship) => genealogyApi.deleteRelationship(client, seen), [client]),
    RelationshipSchema,
  );
  const name = personName(relative);

  // Deletes each row in turn; a row changed since it was loaded stops there, on its conflict.
  const removeRows = async (rows: readonly Relationship[]): Promise<void> => {
    const row = rows.at(0);
    const later = rows.slice(1);
    if (row === undefined) {
      await onRemoved();
      return;
    }
    if (await remove.save(row, {})) {
      await removeRows(later);
      return;
    }
    setRest(later);
  };
  const run = (removing: Promise<void>): void => {
    void writeProblem(removing, 'The relationship could not be removed.').then(setProblem);
  };
  return (
    <li className='grid gap-1 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span>
          <span className='text-muted-foreground'>
            {humanize(line.role)}
            {lineDetail(line)}:{' '}
          </span>
          {relative === undefined ? (
            name
          ) : (
            <Link href={personPath(relative.id)} className='font-medium underline'>
              {name}
            </Link>
          )}
        </span>
        <Button
          size='sm'
          variant='outline'
          aria-label={`Remove ${name} as ${humanize(line.role).toLowerCase()}`}
          onClick={() => {
            run(removeRows(line.relationships));
          }}
        >
          Remove
        </Button>
      </div>
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Remove anyway'
          onResolve={(merged) => {
            run(
              (async (): Promise<void> => {
                if (await remove.resolve(merged)) {
                  await removeRows(rest);
                }
              })(),
            );
          }}
          onDiscard={remove.discard}
        />
      )}
      {problem !== null && (
        <p role='alert' className='text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** A person's recorded relatives, each removable, with a form to add one. */
export function Relatives({ person, people }: { person: Person; people: Person[] }): ReactElement {
  const { lineage, ties = [] } = useGenealogyOptions();
  const { data: user } = useUser();
  const forWhom = user !== undefined && person.linked_user_id === user.id ? 'you' : personName(person);
  const asSubject = useRelationships(person.id, 'person_id');
  const asObject = useRelationships(person.id, 'target_person_id');
  const lines = relationshipLines(asSubject.data ?? [], asObject.data ?? [], ties);
  const error = asSubject.error ?? asObject.error;
  const { mutate } = useSWRConfig();
  const refresh = async (): Promise<void> => {
    await Promise.all([
      asSubject.mutate(),
      asObject.mutate(),
      // Every walk over the ties (circles, metamours, lineage, kinship, the merged map) is now stale.
      mutate((key) => typeof key === 'string' && key.includes(`${PERSON_ENDPOINT}/`)),
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lineage ? 'Relatives' : 'Connections'}</CardTitle>
        <CardDescription>
          {lineage
            ? `Parents, children, partners, siblings, friends and acquaintances recorded for ${forWhom}.`
            : `Partners, friends and everyone else recorded for ${forWhom}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        {error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            The relationships could not be loaded: {error.message}
          </p>
        )}
        {error === undefined && lines.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            {asSubject.isLoading || asObject.isLoading ? 'Loading…' : 'No relatives are recorded yet.'}
          </p>
        )}
        {lines.length > 0 && (
          <ul aria-label={lineage ? 'Relatives' : 'Connections'} className='divide-y rounded-md border'>
            {lines.map((line) => (
              <RelativeRow
                key={line.relationships.map((row) => row.id).join()}
                line={line}
                relative={people.find((candidate) => candidate.id === line.relativeId)}
                onRemoved={refresh}
              />
            ))}
          </ul>
        )}
        <AddRelative person={person} people={people} onAdded={refresh} />
      </CardContent>
    </Card>
  );
}
