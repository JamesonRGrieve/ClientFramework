// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  fieldProblem,
  type FieldSpec,
  fromLocalInput,
  instant,
  localInput,
  minutesLabel,
  numberOf,
  sameInstant,
  shown,
  textOf,
} from './fields';

interface Row {
  at: string;
  minutes: number;
  note: string;
}

const FIELDS: readonly FieldSpec<Row>[] = [
  { key: 'at', label: 'When', input: 'datetime', required: true },
  { key: 'minutes', label: 'Minutes', input: 'number', min: 1, max: 1440, required: true },
  { key: 'note', label: 'Note', input: 'text', maxLength: 10 },
];

const SEVEN_UTC = '2026-09-28T07:00:00Z';
const SEVEN_UTC_ISO = '2026-09-28T07:00:00.000Z';

describe('health fields', () => {
  it('reads a server timestamp with no zone as UTC', () => {
    expect(instant('2026-09-28T07:00:00').toISOString()).toBe(SEVEN_UTC_ISO);
    expect(instant('2026-09-28T07:00:00+02:00').toISOString()).toBe('2026-09-28T05:00:00.000Z');
    expect(instant(SEVEN_UTC).toISOString()).toBe(SEVEN_UTC_ISO);
  });

  it('turns a timestamp into the local input’s text and back to the same instant', () => {
    const text = localInput(SEVEN_UTC);
    expect(text).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(sameInstant(fromLocalInput(text), '2026-09-28T07:00:00')).toBe(true);
  });

  it('compares timestamps by instant, not by spelling', () => {
    expect(sameInstant(SEVEN_UTC, SEVEN_UTC_ISO)).toBe(true);
    expect(sameInstant(SEVEN_UTC, '2026-09-28T07:01:00Z')).toBe(false);
  });

  it('reads blank as none, and shows none as blank', () => {
    expect(numberOf(' ')).toBeNull();
    expect(numberOf('70.5')).toBe(70.5);
    expect(textOf('  ')).toBeNull();
    expect(textOf(' tired ')).toBe('tired');
    expect(shown(null)).toBe('');
    expect(shown(undefined)).toBe('');
    expect(shown(0)).toBe('0');
  });

  it('says a duration in hours and minutes', () => {
    expect(minutesLabel(45)).toBe('45 min');
    expect(minutesLabel(60)).toBe('1 h');
    expect(minutesLabel(450)).toBe('7 h 30 min');
  });

  it('refuses a blank required field, a number out of range, or a time that is no time', () => {
    const fine = { at: '2026-09-28T07:00', minutes: '30', note: '' };
    expect(fieldProblem(FIELDS, fine)).toBeNull();
    expect(fieldProblem(FIELDS, { ...fine, minutes: ' ' })).toBe('Minutes is required.');
    expect(fieldProblem(FIELDS, { ...fine, minutes: '0' })).toBe('Minutes must be between 1 and 1440.');
    expect(fieldProblem(FIELDS, { ...fine, minutes: 'lots' })).toBe('Minutes must be between 1 and 1440.');
    expect(fieldProblem(FIELDS, { ...fine, at: 'yesterday' })).toBe('When is not a date and time.');
  });
});
