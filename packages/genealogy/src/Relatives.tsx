// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { useClient } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { ANCESTRY_ROLES, genealogyApi, PARTNERSHIP_KINDS, type Person, useRelationships } from './genealogyApi';
import { personName } from './people';
import { type RelationshipLine, relationshipFor, relationshipLines, type RelativeRole } from './relationships';
import { personPath } from './routes';

const ROLE_CHOICES: { value: RelativeRole; label: string }[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'partner', label: 'Partner' },
  { value: 'sibling', label: 'Sibling' },
];

/** The details a role can carry: a parent's role for ancestry, or the kind of partnership. */
const DETAILS: Record<RelativeRole, readonly string[]> = {
  parent: ANCESTRY_ROLES,
  child: ANCESTRY_ROLES,
  partner: PARTNERSHIP_KINDS,
  sibling: [],
};

const humanize = (value: string): string => value.replaceAll('_', ' ');

const SELECT_CLASS = 'h-9 rounded-md border bg-background px-3 text-sm';

function AddRelative({
  person,
  people,
  onAdded,
}: {
  person: Person;
  people: Person[];
  onAdded: () => Promise<void>;
}): ReactElement {
  const ids = { role: useId(), relative: useId(), detail: useId() };
  const client = useClient();
  const [role, setRole] = useState<RelativeRole>('parent');
  const [relativeId, setRelativeId] = useState('');
  const [detail, setDetail] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const others = people.filter((candidate) => candidate.id !== person.id);
  const details = DETAILS[role];

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (relativeId === '') {
      setProblem('Choose who the relative is.');
      return;
    }
    void (async (): Promise<void> => {
      try {
        await genealogyApi.createRelationship(
          client,
          relationshipFor(person.id, relativeId, role, detail === '' ? null : detail),
        );
        setRelativeId('');
        setProblem(null);
        await onAdded();
      } catch (error) {
        setProblem(error instanceof Error ? error.message : 'The relationship could not be recorded.');
      }
    })();
  };

  return (
    <form className='grid gap-3' onSubmit={submit}>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <div className='grid gap-1'>
          <Label htmlFor={ids.relative}>Relative</Label>
          <select
            id={ids.relative}
            value={relativeId}
            onChange={(event) => setRelativeId(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value=''>Choose someone…</option>
            {others.map((other) => (
              <option key={other.id} value={other.id}>
                {personName(other)}
              </option>
            ))}
          </select>
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.role}>Is {personName(person)}’s</Label>
          <select
            id={ids.role}
            value={role}
            onChange={(event) => {
              setRole(ROLE_CHOICES.find((choice) => choice.value === event.target.value)?.value ?? 'parent');
              setDetail('');
            }}
            className={SELECT_CLASS}
          >
            {ROLE_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
        {details.length > 0 && (
          <div className='grid gap-1'>
            <Label htmlFor={ids.detail}>{role === 'partner' ? 'Kind' : 'Parent’s role'}</Label>
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
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
      <div>
        <Button type='submit'>Add relative</Button>
      </div>
    </form>
  );
}

function RelativeRow({
  line,
  relative,
  onRemove,
}: {
  line: RelationshipLine;
  relative: Person | undefined;
  onRemove: (line: RelationshipLine) => Promise<string | null>;
}): ReactElement {
  const [problem, setProblem] = useState<string | null>(null);
  const name = personName(relative);
  return (
    <li className='grid gap-1 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span>
          <span className='text-muted-foreground'>
            {humanize(line.role)}
            {line.detail === null ? '' : ` (${humanize(line.detail)})`}:{' '}
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
            void (async (): Promise<void> => {
              setProblem(await onRemove(line));
            })();
          }}
        >
          Remove
        </Button>
      </div>
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
  const client = useClient();
  const asSubject = useRelationships(person.id, 'person_id');
  const asObject = useRelationships(person.id, 'target_person_id');
  const lines = relationshipLines(asSubject.data ?? [], asObject.data ?? []);
  const error = asSubject.error ?? asObject.error;
  const refresh = async (): Promise<void> => {
    await Promise.all([asSubject.mutate(), asObject.mutate()]);
  };

  const onRemove = async (line: RelationshipLine): Promise<string | null> => {
    try {
      await Promise.all(line.relationshipIds.map(async (id) => genealogyApi.deleteRelationship(client, id)));
      await refresh();
      return null;
    } catch (failure) {
      return failure instanceof Error ? failure.message : 'The relationship could not be removed.';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatives</CardTitle>
        <CardDescription>Parents, children, partners and siblings recorded for {personName(person)}.</CardDescription>
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
          <ul aria-label='Relatives' className='divide-y rounded-md border'>
            {lines.map((line) => (
              <RelativeRow
                key={line.relationshipIds.join()}
                line={line}
                relative={people.find((candidate) => candidate.id === line.relativeId)}
                onRemove={onRemove}
              />
            ))}
          </ul>
        )}
        <AddRelative person={person} people={people} onAdded={refresh} />
      </CardContent>
    </Card>
  );
}
