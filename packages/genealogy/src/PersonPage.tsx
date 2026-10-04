// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, useCallback, useState } from 'react';
import { type ConflictField, ConflictPanel, useClient, useEditBase, useGuardedSave, writeProblem } from 'zephyrex';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { genealogyApi, type Person, PersonSchema, usePersons } from './genealogyApi';
import { KinshipLookup } from './KinshipLookup';
import { Lineage } from './Lineage';
import { lifeSpan, personName } from './people';
import { PersonForm } from './PersonForm';
import { Relatives } from './Relatives';
import { GENEALOGY_PATH } from './routes';

const SAVE_FAILURE = 'The details could not be saved.';

const PERSON_CONFLICT_FIELDS: readonly ConflictField<Person>[] = [
  { key: 'name', label: 'Name' },
  { key: 'birth_date', label: 'Born' },
  { key: 'death_date', label: 'Died' },
  { key: 'gender', label: 'Gender' },
  { key: 'description', label: 'Description' },
];

/**
 * A person's details form, saved over the person it was filled from: a newer person arriving
 * while the user edits leaves the form, and its guard, on the one they started from.
 */
function PersonDetails({
  person,
  onProblem,
}: {
  person: Person;
  onProblem: (problem: string | null) => void;
}): ReactElement {
  const client = useClient();
  const { mutate: refreshPersons } = usePersons();
  const { base, rebaseOnSave } = useEditBase(person);
  const update = useGuardedSave(
    useCallback(
      async (seen: Person, changes: Partial<Person>): Promise<void> => {
        await genealogyApi.updatePerson(client, seen, changes);
        await refreshPersons();
      },
      [client, refreshPersons],
    ),
    PersonSchema,
  );
  return (
    <>
      <PersonForm
        key={person.id}
        person={base}
        submitLabel='Save'
        onSave={async (fields) => writeProblem(rebaseOnSave(update.save(base, fields)), SAVE_FAILURE)}
      />
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={PERSON_CONFLICT_FIELDS}
          onResolve={(merged) => {
            void writeProblem(rebaseOnSave(update.resolve(merged)), SAVE_FAILURE).then(onProblem);
          }}
          onDiscard={update.discard}
        />
      )}
    </>
  );
}

/** One person: their details, their relatives, and their ancestors and descendants. */
export function PersonPage({ params }: { params: Record<string, string> }): ReactElement {
  const { personId } = params;
  const client = useClient();
  const router = useRouter();
  const persons = usePersons();
  const { mutate: refreshPersons } = persons;
  const people = persons.data ?? [];
  const person = people.find((candidate) => candidate.id === personId);
  const [problem, setProblem] = useState<string | null>(null);
  const remove = useGuardedSave(
    useCallback(
      async (seen: Person): Promise<void> => {
        await genealogyApi.deletePerson(client, seen);
        await refreshPersons();
        router.push(GENEALOGY_PATH);
      },
      [client, refreshPersons, router],
    ),
    PersonSchema,
  );
  const removeFailure = (writing: Promise<boolean>): void => {
    void writeProblem(writing, 'This person could not be removed.').then(setProblem);
  };

  if (persons.error !== undefined) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        The family tree could not be loaded: {persons.error.message}
      </p>
    );
  }
  if (person === undefined) {
    return (
      <p className='text-sm text-muted-foreground'>
        {persons.isLoading ? 'Loading…' : 'This person is not in your family tree.'}{' '}
        <Link href={GENEALOGY_PATH} className='underline'>
          Back to the family tree
        </Link>
      </p>
    );
  }

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <div className='grid gap-1'>
        <Link href={GENEALOGY_PATH} className='text-sm text-muted-foreground underline'>
          Family tree
        </Link>
        <h1 className='text-3xl font-semibold'>{personName(person)}</h1>
        {lifeSpan(person) !== '' && <p className='text-muted-foreground'>{lifeSpan(person)}</p>}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <PersonDetails key={person.id} person={person} onProblem={setProblem} />
          <div className='grid gap-2 border-t pt-4'>
            <div>
              <Button
                variant='destructive'
                onClick={() => {
                  removeFailure(remove.save(person, {}));
                }}
              >
                Remove {personName(person)} from the tree
              </Button>
            </div>
            {remove.conflict !== null && (
              <ConflictPanel
                conflict={remove.conflict}
                fields={[]}
                applyLabel='Remove anyway'
                onResolve={(merged) => {
                  removeFailure(remove.resolve(merged));
                }}
                onDiscard={remove.discard}
              />
            )}
            {problem !== null && (
              <p role='alert' className='text-sm text-destructive'>
                {problem}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Relatives person={person} people={people} />
      <Lineage person={person} people={people} />
      <KinshipLookup initialPersonId={person.id} />
    </main>
  );
}
