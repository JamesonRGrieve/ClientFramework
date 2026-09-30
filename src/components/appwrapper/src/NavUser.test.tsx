// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { userInitials } from './NavUser';

describe('userInitials', () => {
  it('is the first letter of each name, capitalised', () => {
    expect(userInitials({ firstName: 'ada', lastName: ' lovelace' })).toBe('AL');
  });

  it('is null without both names', () => {
    expect(userInitials({ firstName: 'Ada', lastName: '' })).toBeNull();
    expect(userInitials({ firstName: '  ', lastName: 'Lovelace' })).toBeNull();
    expect(userInitials({ firstName: null })).toBeNull();
    expect(userInitials({})).toBeNull();
  });
});
