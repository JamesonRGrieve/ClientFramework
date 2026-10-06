// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { serverInstant, shownTime } from './serverTime';

const SEVEN_UTC_ISO = '2026-09-28T07:00:00.000Z';

describe('serverInstant', () => {
  it('reads a timestamp without a zone as UTC, and keeps a zone that is given', () => {
    expect(serverInstant('2026-09-28T07:00:00').toISOString()).toBe(SEVEN_UTC_ISO);
    expect(serverInstant('2026-09-28T07:00:00Z').toISOString()).toBe(SEVEN_UTC_ISO);
    expect(serverInstant('2026-09-28T07:00:00+02:00').toISOString()).toBe('2026-09-28T05:00:00.000Z');
  });

  it('reads an ERPNext version, its date and time joined by a space, as UTC', () => {
    expect(serverInstant('2026-09-28 07:00:00.000001').toISOString()).toBe(SEVEN_UTC_ISO);
  });
});

describe('shownTime', () => {
  it('shows a server timestamp in the user’s own time, and nothing for none', () => {
    expect(shownTime('2026-09-28T07:00:00')).toBe(new Date(SEVEN_UTC_ISO).toLocaleString());
    expect([null, undefined, ''].map(shownTime)).toEqual(['', '', '']);
  });
});
