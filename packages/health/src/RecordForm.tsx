// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Label } from '@jgrieve/forms/components/ui/label';
import { Input } from '@jgrieve/forms/components/ui/input';
import { type ReactElement, type ReactNode, type SyntheticEvent, useId } from 'react';
import { Textarea } from 'zephyrex/ui/textarea';
import { type Draft, type FieldSpec, fieldProblem } from './fields';
import type { HealthRow, RecordType } from './records';

const NOTES_ROWS = 3;

const capitalised = (word: string): string => `${word.charAt(0).toUpperCase()}${word.slice(1)}`;

/** Why `draft` can't be saved as a `type` record (its fields' own rules, then the record's), or null. */
export function draftProblem<T extends HealthRow>(type: RecordType<T>, draft: Draft): string | null {
  return fieldProblem(type.fields, draft) ?? type.problemOf?.(draft) ?? null;
}

function FieldInput<T>({
  field,
  id,
  value,
  onChange,
}: {
  field: FieldSpec<T>;
  id: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  const required = field.required === true;
  switch (field.input) {
    case 'datetime':
      return (
        <Input
          id={id}
          type='datetime-local'
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          id={id}
          type='number'
          inputMode='decimal'
          required={required}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'choice':
      return (
        <select
          id={id}
          className='rounded-md border bg-background px-3 py-2 text-sm'
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.choices.map((choice) => (
            <option key={choice} value={choice}>
              {capitalised(choice)}
            </option>
          ))}
        </select>
      );
    case 'text':
      return field.multiline === true ? (
        <Textarea
          id={id}
          rows={NOTES_ROWS}
          maxLength={field.maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          required={required}
          maxLength={field.maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}

/** A `type` record's form: one input per field, laid out in a grid, with the actions below. */
export function RecordForm<T extends HealthRow>({
  type,
  draft,
  onEdit,
  onSubmit,
  label,
  children,
}: {
  type: RecordType<T>;
  draft: Draft;
  onEdit: (key: string, value: string) => void;
  onSubmit: () => void;
  /** Names the form for assistive technology. */
  label: string;
  /** The form's buttons. */
  children: ReactNode;
}): ReactElement {
  const id = useId();
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <form aria-label={label} className='grid gap-3' onSubmit={submit}>
      <div className='grid gap-3 sm:grid-cols-2'>
        {type.fields.map((field) => (
          <div
            key={field.key}
            className={field.input === 'text' && field.multiline === true ? 'grid gap-1 sm:col-span-2' : 'grid gap-1'}
          >
            <Label htmlFor={`${id}-${field.key}`}>{field.label}</Label>
            <FieldInput
              field={field}
              id={`${id}-${field.key}`}
              value={draft[field.key] ?? ''}
              onChange={(value) => onEdit(field.key, value)}
            />
          </div>
        ))}
      </div>
      <div className='flex flex-wrap gap-2'>{children}</div>
    </form>
  );
}
