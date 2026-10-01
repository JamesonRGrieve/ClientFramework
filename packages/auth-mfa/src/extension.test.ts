// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { authMfaExtension as registered } from 'zephyrex/extensions/auth_mfa';
import { authMfaExtension } from './extension';
import { MfaSettings } from './MfaSettings';

describe('authMfaExtension', () => {
  it('is the registered auth_mfa extension, with the two-factor section on the account page', () => {
    expect(authMfaExtension).toMatchObject({ name: 'auth_mfa', serverExtension: 'auth_mfa' });
    expect(authMfaExtension.displayName).toBe(registered.displayName);
    expect(authMfaExtension.managementTabs).toEqual([
      expect.objectContaining({ id: 'mfa', label: 'Two-factor authentication', component: MfaSettings }),
    ]);
  });
});
