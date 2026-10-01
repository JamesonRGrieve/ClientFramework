// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { userInitials } from './NavUser';

describe('userInitials', () => {
  it('is the first letter of each name, capitalised', () => {
    expect(userInitials({ first_name: 'ada', last_name: ' lovelace' })).toBe('AL');
  });

  it('is null without both names', () => {
    expect(userInitials({ first_name: 'Ada', last_name: '' })).toBeNull();
    expect(userInitials({ first_name: '  ', last_name: 'Lovelace' })).toBeNull();
    expect(userInitials({ first_name: null })).toBeNull();
    expect(userInitials({})).toBeNull();
  });
});
