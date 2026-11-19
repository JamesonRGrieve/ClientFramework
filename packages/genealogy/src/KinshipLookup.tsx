// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, useId, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { type Person, useKinship, usePersons } from './genealogyApi';
import { describeKinship } from './kinship';
import { personName } from './people';
import { PersonPicker as SearchablePersonPicker } from './PersonPicker';

function PersonPicker({
  label,
  people,
  value,
  onChange,
}: {
  label: string;
  people: Person[];
  value: string | null;
  onChange: (personId: string | null) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className='grid gap-1'>
      <Label htmlFor={id}>{label}</Label>
      <SearchablePersonPicker
        id={id}
        people={people}
        value={value ?? ''}
        onChange={(next) => onChange(next === '' ? null : next)}
        placeholder='Choose someone…'
      />
    </div>
  );
}

/** How two people in the tree are related, in words. */
export function KinshipLookup({ initialPersonId = null }: { initialPersonId?: string | null }): ReactElement {
  const persons = usePersons();
  const people = [...(persons.data ?? [])].sort((a, b) => personName(a).localeCompare(personName(b)));
  const [personId, setPersonId] = useState<string | null>(initialPersonId);
  const [otherId, setOtherId] = useState<string | null>(null);
  const kinship = useKinship(personId, otherId);
  const nameOf = (id: string | null): string => personName(people.find((person) => person.id === id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are they related?</CardTitle>
        <CardDescription>Pick two people to find their common ancestors.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <PersonPicker label='Person' people={people} value={personId} onChange={setPersonId} />
          <PersonPicker label='Relative' people={people} value={otherId} onChange={setOtherId} />
        </div>
        {kinship.error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            Their relationship could not be worked out: {kinship.error.message}
          </p>
        )}
        {kinship.data !== undefined && (
          <div role='status' className='grid gap-1 text-sm'>
            <p className='font-medium'>{describeKinship(kinship.data, nameOf(personId), nameOf(otherId))}</p>
            {kinship.data.common_ancestors.length > 0 && (
              <p className='text-muted-foreground'>
                Through {kinship.data.common_ancestors.map((ancestorId) => nameOf(ancestorId)).join(' and ')}.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
