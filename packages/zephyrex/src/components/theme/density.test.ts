// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { DENSITIES, densityAttribute, densityFrom } from './density';

describe('density', () => {
  it('offers sparse, comfortable and compact, roomiest first', () => {
    expect(DENSITIES).toEqual(['sparse', 'comfortable', 'compact']);
  });

  it('reads anything but sparse or compact as comfortable', () => {
    expect(densityFrom('compact')).toBe('compact');
    expect(densityFrom('sparse')).toBe('sparse');
    for (const value of ['comfortable', '', 'dense', undefined, null]) {
      expect(densityFrom(value)).toBe('comfortable');
    }
  });

  it('marks <html> for sparse and compact, not for comfortable', () => {
    expect(densityAttribute('compact')).toEqual({ 'data-density': 'compact' });
    expect(densityAttribute('sparse')).toEqual({ 'data-density': 'sparse' });
    expect(densityAttribute('comfortable')).toEqual({});
    expect(densityAttribute(undefined)).toEqual({});
  });
});
