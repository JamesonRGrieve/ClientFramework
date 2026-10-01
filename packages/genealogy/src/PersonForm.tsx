// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import type { Person, PersonFields } from './genealogyApi';
import { dateField, dateInput } from './people';

const EMPTY: Pick<Person, 'name' | 'birth_date' | 'death_date' | 'gender' | 'description'> = {
  name: null,
  birth_date: null,
  death_date: null,
  gender: null,
  description: null,
};

const text = (value: string): string | null => (value.trim() === '' ? null : value.trim());

/**
 * A person's details, blank for a new record or filled from `person` for an edit. `onSave` answers
 * with a problem to show, or null once the server has stored them.
 */
export function PersonForm({
  person = EMPTY,
  submitLabel,
  onSave,
}: {
  person?: Pick<Person, 'name' | 'birth_date' | 'death_date' | 'gender' | 'description'>;
  submitLabel: string;
  onSave: (fields: PersonFields) => Promise<string | null>;
}): ReactElement {
  const ids = { name: useId(), birth: useId(), death: useId(), gender: useId(), description: useId() };
  const [name, setName] = useState(person.name ?? '');
  const [birth, setBirth] = useState(dateInput(person.birth_date));
  const [death, setDeath] = useState(dateInput(person.death_date));
  const [gender, setGender] = useState(person.gender ?? '');
  const [description, setDescription] = useState(person.description ?? '');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (birth !== '' && death !== '' && death < birth) {
      setProblem('The date of death is before the date of birth.');
      return;
    }
    setPending(true);
    void (async (): Promise<void> => {
      const failure = await onSave({
        name: text(name),
        birth_date: dateField(birth),
        death_date: dateField(death),
        gender: text(gender),
        description: text(description),
      });
      setProblem(failure);
      setPending(false);
    })();
  };

  return (
    <form className='grid gap-3' onSubmit={submit}>
      <div className='grid gap-1'>
        <Label htmlFor={ids.name}>Name</Label>
        <Input id={ids.name} value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <div className='grid gap-1'>
          <Label htmlFor={ids.birth}>Born</Label>
          <Input id={ids.birth} type='date' value={birth} onChange={(event) => setBirth(event.target.value)} />
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.death}>Died</Label>
          <Input id={ids.death} type='date' value={death} onChange={(event) => setDeath(event.target.value)} />
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.gender}>Gender</Label>
          <Input id={ids.gender} value={gender} onChange={(event) => setGender(event.target.value)} />
        </div>
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.description}>Notes</Label>
        <Input id={ids.description} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
      <div>
        <Button type='submit' disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
