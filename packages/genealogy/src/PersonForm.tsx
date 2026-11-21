// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { ChoiceChip } from 'zephyrex/ui/choice-chip';
import { Textarea } from 'zephyrex/ui/textarea';
import type { Person, PersonFields } from './genealogyApi';
import { dateField, dateInput } from './people';
import { useGenealogyOptions } from './OptionsProvider';

const EMPTY: Pick<Person, 'name' | 'birth_date' | 'death_date' | 'gender' | 'description'> = {
  name: null,
  birth_date: null,
  death_date: null,
  gender: null,
  description: null,
};

const text = (value: string): string | null => (value.trim() === '' ? null : value.trim());

/** The genders offered by name, as stored; anything else is "Other", in the person's own words. */
const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Nonbinary' },
] as const;
const OTHER = 'other';
const NAMED_GENDERS: ReadonlySet<string> = new Set(GENDERS.map((gender) => gender.value));

/** The choice a stored gender shows as, and the words in the "Other" field. */
function genderChoice(stored: string | null): { choice: string; words: string } {
  if (stored === null || stored.trim() === '') {
    return { choice: '', words: '' };
  }
  const value = stored.trim().toLowerCase();
  if (NAMED_GENDERS.has(value)) {
    return { choice: value, words: '' };
  }
  return { choice: OTHER, words: value === OTHER ? '' : stored.trim() };
}

/** What is stored for a choice: the named gender, the person's own words for "Other", or nothing. */
function genderValue(choice: string, words: string): string | null {
  if (choice === OTHER) {
    return text(words) ?? OTHER;
  }
  return choice === '' ? null : choice;
}

/**
 * A person's details, blank for a new record or filled from `person` for an edit. `onSave` answers
 * with a problem to show, or null once the server has stored them.
 *
 * With `autosave` (an existing person's page), there is no Save button: a field is saved as you
 * leave it, a gender as you pick it, and a quiet status says when it's stored, as the rest of the
 * page edits in place. A new person keeps the button: creating one is a deliberate step.
 */
export function PersonForm({
  person = EMPTY,
  submitLabel,
  onSave,
  autosave = false,
}: {
  person?: Pick<Person, 'name' | 'birth_date' | 'death_date' | 'gender' | 'description'>;
  submitLabel: string;
  onSave: (fields: PersonFields) => Promise<string | null>;
  autosave?: boolean;
}): ReactElement {
  const options = useGenealogyOptions();
  const ids = {
    name: useId(),
    birth: useId(),
    death: useId(),
    gender: useId(),
    genderWords: useId(),
    description: useId(),
  };
  const [name, setName] = useState(person.name ?? '');
  const [birth, setBirth] = useState(dateInput(person.birth_date));
  const [death, setDeath] = useState(dateInput(person.death_date));
  const [gender, setGender] = useState(() => genderChoice(person.gender).choice);
  const [genderWords, setGenderWords] = useState(() => genderChoice(person.gender).words);
  const [description, setDescription] = useState(person.description ?? '');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fieldsOf = (choice: string = gender): PersonFields => ({
    name: text(name),
    birth_date: dateField(birth),
    death_date: dateField(death),
    gender: genderValue(choice, genderWords),
    description: text(description),
  });
  // What the server last stored, so leaving an unchanged field saves nothing.
  const [stored, setStored] = useState(() => JSON.stringify(fieldsOf()));

  const commit = (fields: PersonFields): void => {
    if (birth !== '' && death !== '' && death < birth) {
      setProblem('The date of death is before the date of birth.');
      return;
    }
    const wire = JSON.stringify(fields);
    if (autosave && wire === stored) {
      return;
    }
    setPending(true);
    setSaved(false);
    void (async (): Promise<void> => {
      const failure = await onSave(fields);
      setProblem(failure);
      setPending(false);
      if (failure === null) {
        setStored(wire);
        setSaved(true);
      }
    })();
  };
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    commit(fieldsOf());
  };
  /** Saves as a field is left, with autosave on. */
  const leave = autosave ? (): void => commit(fieldsOf()) : undefined;

  return (
    <form className='grid gap-3' onSubmit={submit}>
      {/* Name and dates share a row: a name rarely needs more than half the card. */}
      <div className={options.lineage ? 'grid grid-cols-1 gap-3 sm:grid-cols-3' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
        <div className='grid gap-1'>
          <Label htmlFor={ids.name}>Name</Label>
          <Input id={ids.name} value={name} onChange={(event) => setName(event.target.value)} onBlur={leave} />
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.birth}>{options.lineage ? 'Born' : 'Birthday'}</Label>
          <Input
            id={ids.birth}
            type='date'
            value={birth}
            onChange={(event) => setBirth(event.target.value)}
            onBlur={leave}
          />
        </div>
        {options.lineage && (
          <div className='grid gap-1'>
            <Label htmlFor={ids.death}>Died</Label>
            <Input
              id={ids.death}
              type='date'
              value={death}
              onChange={(event) => setDeath(event.target.value)}
              onBlur={leave}
            />
          </div>
        )}
        <div className='col-span-full grid gap-1'>
          <span id={ids.gender} className='text-sm font-medium'>
            Gender
          </span>
          <div role='radiogroup' aria-labelledby={ids.gender} className='flex flex-wrap gap-1.5'>
            {[{ value: '', label: 'Not recorded' }, ...GENDERS, { value: OTHER, label: 'Other' }].map((choice) => (
              <ChoiceChip
                key={choice.value}
                checked={gender === choice.value}
                onClick={() => {
                  setGender(choice.value);
                  // "Other" waits for their words; any other pick is the whole answer.
                  if (autosave && choice.value !== OTHER) {
                    commit(fieldsOf(choice.value));
                  }
                }}
              >
                {choice.label}
              </ChoiceChip>
            ))}
          </div>
        </div>
        {gender === OTHER && (
          <div className='grid gap-1'>
            <Label htmlFor={ids.genderWords}>Gender, in their words</Label>
            <Input
              id={ids.genderWords}
              value={genderWords}
              onChange={(event) => setGenderWords(event.target.value)}
              onBlur={leave}
            />
          </div>
        )}
      </div>
      <div className='col-span-full grid gap-1'>
        <Label htmlFor={ids.description}>Notes</Label>
        <Textarea
          id={ids.description}
          rows={3}
          className='min-h-20 resize-y'
          placeholder='Allergies, how you met, anything worth remembering'
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onBlur={leave}
        />
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
      {autosave ? (
        <p role='status' className='min-h-4 text-xs text-muted-foreground'>
          {pending ? 'Saving…' : saved ? 'Saved' : ''}
        </p>
      ) : (
        <div>
          <Button type='submit' disabled={pending}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
