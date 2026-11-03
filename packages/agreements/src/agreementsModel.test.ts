// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { DEFAULT_KINDS, dueForRevisit, shownKind } from './agreementsModel';

describe('the agreements model', () => {
  it('shows a term under its own kind when the app names it, else the default', () => {
    const kinds = [...DEFAULT_KINDS, { value: 'rule', heading: 'House rules', choice: 'Rule' }];
    expect(shownKind('rule', kinds)).toBe('rule');
    expect(shownKind('clause', kinds)).toBe('term');
    expect(shownKind('clause', [])).toBe('clause');
  });

  it('is due for a revisit on the day and after, never without a date', () => {
    const newYear = '2027-01-01';
    expect(dueForRevisit(newYear, '2026-12-31')).toBe(false);
    expect(dueForRevisit(newYear, newYear)).toBe(true);
    expect(dueForRevisit(newYear, '2027-02-01')).toBe(true);
    expect(dueForRevisit(null, '2027-02-01')).toBe(false);
  });
});
