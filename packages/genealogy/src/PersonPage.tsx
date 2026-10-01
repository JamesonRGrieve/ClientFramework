// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, useState } from 'react';
import { useClient } from 'zephyrex';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { genealogyApi, usePersons } from './genealogyApi';
import { KinshipLookup } from './KinshipLookup';
import { Lineage } from './Lineage';
import { lifeSpan, personName } from './people';
import { PersonForm } from './PersonForm';
import { Relatives } from './Relatives';
import { GENEALOGY_PATH } from './routes';

/** One person: their details, their relatives, and their ancestors and descendants. */
export function PersonPage({ params }: { params: Record<string, string> }): ReactElement {
  const { personId } = params;
  const client = useClient();
  const router = useRouter();
  const persons = usePersons();
  const people = persons.data ?? [];
  const person = people.find((candidate) => candidate.id === personId);
  const [problem, setProblem] = useState<string | null>(null);

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
          <PersonForm
            key={person.id}
            person={person}
            submitLabel='Save'
            onSave={async (fields) => {
              try {
                await genealogyApi.updatePerson(client, person.id, fields);
                await persons.mutate();
                return null;
              } catch (error) {
                return error instanceof Error ? error.message : 'The details could not be saved.';
              }
            }}
          />
          <div className='grid gap-2 border-t pt-4'>
            <div>
              <Button
                variant='destructive'
                onClick={() => {
                  void (async (): Promise<void> => {
                    try {
                      await genealogyApi.deletePerson(client, person.id);
                      await persons.mutate();
                      router.push(GENEALOGY_PATH);
                    } catch (error) {
                      setProblem(error instanceof Error ? error.message : 'This person could not be removed.');
                    }
                  })();
                }}
              >
                Remove {personName(person)} from the tree
              </Button>
            </div>
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
