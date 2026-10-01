// SPDX-License-Identifier: AGPL-3.0-or-later
import { hasSession } from '@zephyrex/auth';
import { describe, expect, it } from 'vitest';
import { withSession } from './session';

describe('withSession', () => {
  it('signs the test browser in, and its cleanup signs it out', () => {
    expect(hasSession()).toBe(false);
    const signOut = withSession();
    expect(hasSession()).toBe(true);
    signOut();
    expect(hasSession()).toBe(false);
  });
});
