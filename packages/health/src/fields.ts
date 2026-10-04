// SPDX-License-Identifier: AGPL-3.0-or-later
// How a record's fields are entered: each field's input, and the conversions between the server's
// values and the text a form holds.
import { serverInstant } from 'zephyrex';

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;
const LOCAL_INPUT_LENGTH = 16;

/** A form's values, as typed, by field. */
export type Draft = Readonly<Record<string, string>>;

interface FieldBase<T> {
  readonly key: keyof T & string;
  readonly label: string;
  readonly required?: boolean;
}

/** One input of a record's form. */
export type FieldSpec<T> = FieldBase<T> &
  (
    | { readonly input: 'datetime' }
    | { readonly input: 'number'; readonly min: number; readonly max: number; readonly step?: number }
    | { readonly input: 'text'; readonly maxLength: number; readonly multiline?: boolean }
    | { readonly input: 'choice'; readonly choices: readonly string[] }
  );

/** A server timestamp as a datetime-local input's text, in the user's own time zone. */
export function localInput(value: string): string {
  const at = serverInstant(value);
  return new Date(at.getTime() - at.getTimezoneOffset() * MS_PER_MINUTE).toISOString().slice(0, LOCAL_INPUT_LENGTH);
}

/** A datetime-local input's text (the user's time) as the UTC timestamp the server takes. */
export function fromLocalInput(text: string): string {
  return new Date(text).toISOString();
}

/** Whether two server timestamps name the same instant, however they are written. */
export const sameInstant = (a: string, b: string): boolean => serverInstant(a).getTime() === serverInstant(b).getTime();

/** A number field's text as its value; blank is none. */
export const numberOf = (text: string): number | null => (text.trim() === '' ? null : Number(text));

/** A text field's value; blank is none. */
export const textOf = (text: string): string | null => (text.trim() === '' ? null : text.trim());

/** A value as a form's text: none is blank. */
export const shown = (value: string | number | null | undefined): string =>
  value === null || value === undefined ? '' : String(value);

/** A duration in minutes, in words: "1 h 30 min". */
export function minutesLabel(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  if (hours === 0) {
    return `${String(rest)} min`;
  }
  return rest === 0 ? `${String(hours)} h` : `${String(hours)} h ${String(rest)} min`;
}

/**
 * Why `draft` can't be saved by `fields`' own rules (a required field left blank, a number out of
 * range), or null when it can.
 */
export function fieldProblem<T>(fields: readonly FieldSpec<T>[], draft: Draft): string | null {
  for (const field of fields) {
    const text = (draft[field.key] ?? '').trim();
    if (text === '') {
      if (field.required === true) {
        return `${field.label} is required.`;
      }
      continue;
    }
    if (field.input === 'number') {
      const value = Number(text);
      if (Number.isNaN(value) || value < field.min || value > field.max) {
        return `${field.label} must be between ${String(field.min)} and ${String(field.max)}.`;
      }
    }
    if (field.input === 'datetime' && Number.isNaN(new Date(text).getTime())) {
      return `${field.label} is not a date and time.`;
    }
  }
  return null;
}
