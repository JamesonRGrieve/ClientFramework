// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { authSessionExtension as registered } from 'zephyrex/extensions/auth_session';
import { authSessionExtension } from './extension';
import { Sessions } from './Sessions';

describe('authSessionExtension', () => {
  it('is the registered auth_session extension, with the active sessions section on the account page', () => {
    expect(authSessionExtension).toMatchObject({ name: 'auth_session', serverExtension: 'auth_session' });
    expect(authSessionExtension.displayName).toBe(registered.displayName);
    expect(authSessionExtension.managementTabs).toEqual([
      expect.objectContaining({ id: 'sessions', label: 'Active Sessions', component: Sessions }),
    ]);
  });
});
