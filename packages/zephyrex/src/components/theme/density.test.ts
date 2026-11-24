// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { DENSITIES, densityAttribute, densityFrom } from './density';

describe('density', () => {
  it('offers comfortable first, then compact', () => {
    expect(DENSITIES).toEqual(['comfortable', 'compact']);
  });

  it('reads anything but compact as comfortable', () => {
    expect(densityFrom('compact')).toBe('compact');
    for (const value of ['comfortable', '', 'dense', undefined, null]) {
      expect(densityFrom(value)).toBe('comfortable');
    }
  });

  it('marks <html> only for compact', () => {
    expect(densityAttribute('compact')).toEqual({ 'data-density': 'compact' });
    expect(densityAttribute('comfortable')).toEqual({});
    expect(densityAttribute(undefined)).toEqual({});
  });
});
