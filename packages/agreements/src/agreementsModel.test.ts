// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { dueForRevisit, KINDS, kindChoice, kindLabel } from './agreementsModel';

describe('the agreements model', () => {
  it('names every kind of term, as a heading and as a choice', () => {
    expect(KINDS.map(kindLabel)).toEqual(['What we agreed', 'Likes', 'Limits']);
    expect(KINDS.map(kindChoice)).toEqual(['Agreed', 'Like', 'Limit']);
  });

  it('is due for a revisit on the day and after, never without a date', () => {
    const newYear = '2027-01-01';
    expect(dueForRevisit(newYear, '2026-12-31')).toBe(false);
    expect(dueForRevisit(newYear, newYear)).toBe(true);
    expect(dueForRevisit(newYear, '2027-02-01')).toBe(true);
    expect(dueForRevisit(null, '2027-02-01')).toBe(false);
  });
});
