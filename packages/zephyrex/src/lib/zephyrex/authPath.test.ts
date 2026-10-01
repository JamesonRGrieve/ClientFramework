// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { accountsEnabled } from './authPath';

describe('accountsEnabled', () => {
  it('is on unless the app turns accounts off', () => {
    expect(accountsEnabled({})).toBe(true);
    expect(accountsEnabled({ auth: {} })).toBe(true);
    expect(accountsEnabled({ auth: { enabled: true } })).toBe(true);
    expect(accountsEnabled({ auth: { enabled: false } })).toBe(false);
  });
});
