// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, useId } from 'react';
import { type Person, personName } from 'zephyrex/pages/team';

const NOBODY = '';

/** Choose one of `people` (the users the viewer can see), or nobody yet (null). */
export function PersonPicker({
  label,
  people,
  value,
  onChange,
}: {
  label: string;
  people: readonly Person[];
  value: string | null;
  onChange: (userId: string | null) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className='grid gap-1'>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className='rounded-md border bg-background px-2 py-2 text-sm'
        value={value ?? NOBODY}
        onChange={(event) => onChange(event.target.value === NOBODY ? null : event.target.value)}
      >
        <option value={NOBODY}>Choose someone…</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {personName(person)}
          </option>
        ))}
      </select>
    </div>
  );
}
