// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import type { ReactElement } from 'react';
import { useClient } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { genealogyApi, usePersons } from './genealogyApi';
import { lifeSpan, personName } from './people';
import { PersonForm } from './PersonForm';
import { personPath } from './routes';

/** Everyone the user has recorded, sorted by name, with a form to add someone. */
export function PeopleList(): ReactElement {
  const client = useClient();
  const persons = usePersons();
  const sorted = [...(persons.data ?? [])].sort((a, b) => personName(a).localeCompare(personName(b)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>People</CardTitle>
        <CardDescription>Everyone in your family tree. Open someone to record their relatives.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        {persons.error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            Your family tree could not be loaded: {persons.error.message}
          </p>
        )}
        {persons.error === undefined && sorted.length === 0 && (
          <p className='text-sm text-muted-foreground'>{persons.isLoading ? 'Loading…' : 'Nobody is recorded yet.'}</p>
        )}
        {sorted.length > 0 && (
          <ul aria-label='People' className='divide-y rounded-md border'>
            {sorted.map((person) => (
              <li key={person.id}>
                <Link href={personPath(person.id)} className='flex justify-between gap-2 px-4 py-3 text-sm hover:bg-muted'>
                  <span className='font-medium'>{personName(person)}</span>
                  <span className='text-muted-foreground'>{lifeSpan(person)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <details className='rounded-md border p-4'>
          <summary className='cursor-pointer text-sm font-medium'>Add a person</summary>
          <div className='pt-4'>
            <PersonForm
              submitLabel='Add person'
              onSave={async (fields) => {
                try {
                  await genealogyApi.createPerson(client, fields);
                  await persons.mutate();
                  return null;
                } catch (error) {
                  return error instanceof Error ? error.message : 'The person could not be added.';
                }
              }}
            />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
