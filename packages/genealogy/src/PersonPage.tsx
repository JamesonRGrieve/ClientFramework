// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { LoadProblem } from 'zephyrex/ui/load-problem';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import { Button } from '@jgrieve/forms/components/ui/button';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, useCallback, useState } from 'react';
import { type ConflictField, ConflictPanel, useClient, useEditBase, useGuardedSave, useUser, writeProblem } from 'zephyrex';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { genealogyApi, type Person, PersonSchema, usePersons } from './genealogyApi';
import { KinshipLookup } from './KinshipLookup';
import { Lineage } from './Lineage';
import { useGenealogyOptions } from './OptionsProvider';
import { lifeSpan, personInitials, personName } from './people';
import { PersonForm } from './PersonForm';
import { Relatives } from './Relatives';
import { SocialCircle } from './SocialCircle';
import { GENEALOGY_PATH } from './routes';
import { usePersonColor } from './usePersonColor';

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
        autosave
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
  const colorOf = usePersonColor();
  const { personId } = params;
  const options = useGenealogyOptions();
  const client = useClient();
  const router = useRouter();
  const persons = usePersons();
  const { mutate: refreshPersons } = persons;
  const people = persons.data ?? [];
  const person = people.find((candidate) => candidate.id === personId);
  const { data: user } = useUser();
  // Your own record: you leave by deleting your account, not by removing yourself from your tree.
  const isYou = user !== undefined && person?.linked_user_id === user.id;
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
    return <LoadProblem what='the tree' error={persons.error} onRetry={async () => persons.mutate()} />;
  }
  if (person === undefined && persons.isLoading) {
    return <SkeletonRows rows={4} avatar label='Loading this person' />;
  }
  if (person === undefined) {
    return (
      <p className='text-sm text-muted-foreground'>
        This person is not in your tree.{' '}
        <Link href={GENEALOGY_PATH} className='underline'>
          {options.tree}
        </Link>
      </p>
    );
  }

  return (
    <main className='mx-auto flex w-full max-w-5xl flex-col gap-6 2xl:max-w-none'>
      <div className='grid gap-3'>
        <Link href={GENEALOGY_PATH} className='text-sm text-muted-foreground hover:underline'>
          <span aria-hidden='true'>← </span>
          {options.tree}
        </Link>
        <div className='flex flex-wrap items-center gap-4'>
          <span
            aria-hidden='true'
            className={`inline-flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${colorOf(person.id)}`}
          >
            {personInitials(person)}
          </span>
          <div className='grid min-w-0 flex-1 gap-1'>
            <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>{personName(person)}</h1>
            <p className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
              {isYou && <span className='rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground'>You</span>}
              {!isYou && person.linked_user_id !== null && person.linked_user_id !== undefined && (
                <span className='rounded-full bg-muted px-2 py-0.5 font-medium'>On the app</span>
              )}
              {lifeSpan(person) !== '' && <span>{lifeSpan(person)}</span>}
              {person.description !== null && person.description !== '' && <span>{person.description}</span>}
            </p>
          </div>
          {!isYou && (
            <Button
              variant='outline'
              size='sm'
              className='shrink-0 text-destructive'
              aria-label={`Remove from the tree: ${personName(person)}`}
              onClick={() => {
                removeFailure(remove.save(person, {}));
              }}
            >
              <span className='sm:hidden'>Remove</span>
              <span className='hidden sm:inline'>Remove from the tree</span>
            </Button>
          )}
        </div>
      </div>
      {/* On a wide screen the details and the connections sit side by side: both are short. */}
      <div className='grid items-start gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <PersonDetails key={person.id} person={person} onProblem={setProblem} />
            <div className='grid gap-2'>
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
        {/* How they are connected comes first: an app's panels (a long card, say) would bury it. */}
        <Relatives person={person} people={people} />
      </div>
      {(options.panels ?? []).map(({ name, component: Panel }) => (
        <Panel key={name} person={person} />
      ))}
      <SocialCircle person={person} people={people} />
      {options.lineage && <Lineage person={person} people={people} />}
      {options.lineage && <KinshipLookup initialPersonId={person.id} />}
    </main>
  );
}
