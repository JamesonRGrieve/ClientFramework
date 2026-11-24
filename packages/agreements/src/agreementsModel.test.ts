// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { DEFAULT_KINDS, dueForRevisit, filledKinds, shownKind, type Term } from './agreementsModel';

describe('the agreements model', () => {
  it('shows a term under its own kind when the app names it, else the default', () => {
    const kinds = [...DEFAULT_KINDS, { value: 'rule', heading: 'House rules', choice: 'Rule' }];
    expect(shownKind('rule', kinds)).toBe('rule');
    expect(shownKind('clause', kinds)).toBe('term');
    expect(shownKind('clause', [])).toBe('clause');
  });

  it('counts the kinds that have terms, folding unknown kinds into the default', () => {
    const kinds = [...DEFAULT_KINDS, { value: 'rule', heading: 'House rules', choice: 'Rule' }];
    const term = (kind: string): Term => ({
      id: kind,
      kind,
      text: 'Weekends',
      position: 0,
      written_by: 'u1',
    });
    expect(filledKinds({ terms: [] }, kinds)).toBe(0);
    expect(filledKinds({ terms: [term('clause'), term('term')] }, kinds)).toBe(1);
    expect(filledKinds({ terms: [term('term'), term('rule')] }, kinds)).toBe(2);
  });

  it('is due for a revisit on the day and after, never without a date', () => {
    const newYear = '2027-01-01';
    expect(dueForRevisit(newYear, '2026-12-31')).toBe(false);
    expect(dueForRevisit(newYear, newYear)).toBe(true);
    expect(dueForRevisit(newYear, '2027-02-01')).toBe(true);
    expect(dueForRevisit(null, '2027-02-01')).toBe(false);
  });
});
