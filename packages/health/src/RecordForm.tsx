// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { ChoiceChip } from 'zephyrex/ui/choice-chip';
import { chipGroup } from 'zephyrex/hooks/chipKeys';
import { Label } from '@jgrieve/forms/components/ui/label';
import { Input } from '@jgrieve/forms/components/ui/input';
import { type ReactElement, type ReactNode, type SyntheticEvent, useId } from 'react';
import { Textarea } from 'zephyrex/ui/textarea';
import { type Draft, type FieldSpec, fieldProblem, quickTimes } from './fields';
import type { HealthRow, RecordType } from './records';

const NOTES_ROWS = 3;

const capitalised = (word: string): string => `${word.charAt(0).toUpperCase()}${word.slice(1)}`;

/** Why `draft` can't be saved as a `type` record (its fields' own rules, then the record's), or null. */
export function draftProblem<T extends HealthRow>(type: RecordType<T>, draft: Draft): string | null {
  return fieldProblem(type.fields, draft) ?? type.problemOf?.(draft) ?? null;
}

/**
 * A whole number from a short range, each value named (a mood: Awful … Great): one tap, the words
 * visible, the number kept underneath. Radios, so arrow keys and the label work as usual.
 */
function Scale({
  id,
  labels,
  min,
  value,
  onChange,
}: {
  id: string;
  labels: readonly string[];
  min: number;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <div role='radiogroup' aria-labelledby={`${id}-label`} className='grid grid-cols-5 gap-1.5'>
      {labels.map((word, index) => {
        const option = String(min + index);
        return (
          <label
            key={option}
            className='flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'
          >
            <input
              type='radio'
              className='sr-only'
              name={id}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span className='text-base font-semibold tabular-nums text-foreground'>{option}</span>
            {word}
          </label>
        );
      })}
    </div>
  );
}

const SUGGESTION =
  'rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground aria-checked:border-primary aria-checked:bg-primary/10 aria-checked:text-foreground';
/** Up to this many choices show as chips; more as a list. */
const CHOICE_CHIPS = 6;

function FieldInput<T>({
  field,
  id,
  value,
  onChange,
  suggestions = [],
}: {
  field: FieldSpec<T>;
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Values a single-line text field offers one tap each (e.g. the people in your tree). */
  suggestions?: readonly string[] | undefined;
}): ReactElement {
  const required = field.required === true;
  switch (field.input) {
    case 'datetime':
      return (
        <div className='grid gap-1.5'>
          <Input
            id={id}
            type='datetime-local'
            required={required}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <fieldset aria-label={`Quick times for ${field.label}`} className='min-w-0 flex flex-wrap gap-1.5'>
            <div className='contents' ref={chipGroup}>
              {quickTimes(new Date()).map(([name, text]) => (
                <button
                  key={name}
                  type='button'
                  aria-pressed={value === text}
                  onClick={() => onChange(text)}
                  className={SUGGESTION}
                >
                  {name}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      );
    case 'number':
      if (field.labels?.length === field.max - field.min + 1) {
        return <Scale id={id} labels={field.labels} min={field.min} value={value} onChange={onChange} />;
      }
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
      if (field.choices.length <= CHOICE_CHIPS) {
        return (
          <div role='radiogroup' aria-labelledby={`${id}-label`} id={id} className='flex flex-wrap gap-1.5'>
            {field.choices.map((choice) => (
              <ChoiceChip key={choice} checked={value === choice} onClick={() => onChange(choice)}>
                {capitalised(choice)}
              </ChoiceChip>
            ))}
          </div>
        );
      }
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
        // With suggestions, the chips come first (they're the usual answer) and the box takes the rest.
        <div className='grid gap-1.5'>
          {suggestions.length > 0 && (
            <fieldset aria-label={`Suggestions for ${field.label}`} className='min-w-0 flex flex-wrap gap-1.5'>
              <div className='contents' ref={chipGroup}>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type='button'
                    aria-pressed={value === suggestion}
                    onClick={() => onChange(value === suggestion ? '' : suggestion)}
                    className={SUGGESTION}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <Input
            id={id}
            required={required}
            maxLength={field.maxLength}
            placeholder={suggestions.length > 0 ? 'Or type your own' : undefined}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
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
  suggestions = {},
  stacked = false,
}: {
  type: RecordType<T>;
  draft: Draft;
  onEdit: (key: string, value: string) => void;
  onSubmit: () => void;
  /** Names the form for assistive technology. */
  label: string;
  /** The form's buttons. */
  children: ReactNode;
  /** Per field key, values a text field offers one tap each. */
  suggestions?: Readonly<Record<string, readonly string[]>> | undefined;
  /** One field per row, for a narrow column. */
  stacked?: boolean;
}): ReactElement {
  const id = useId();
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <form aria-label={label} className='grid gap-3' onSubmit={submit}>
      <div className={stacked ? 'grid gap-3' : 'grid gap-3 sm:grid-cols-2'}>
        {type.fields.map((field) => (
          <div
            key={field.key}
            className={field.input === 'text' && field.multiline === true ? 'grid gap-1 col-span-full' : 'grid gap-1'}
          >
            <Label htmlFor={`${id}-${field.key}`} id={`${id}-${field.key}-label`}>
              {field.label}
            </Label>
            <FieldInput
              field={field}
              id={`${id}-${field.key}`}
              value={draft[field.key] ?? ''}
              onChange={(value) => onEdit(field.key, value)}
              suggestions={suggestions[field.key]}
            />
          </div>
        ))}
      </div>
      <div className='flex flex-wrap gap-2'>{children}</div>
    </form>
  );
}
