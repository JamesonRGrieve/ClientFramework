// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { authDevicePairingExtension as registered } from 'zephyrex/extensions/auth_device_pairing';
import { authDevicePairingExtension } from './extension';
import { PairApprove } from './PairApprove';
import { PairRequest } from './PairRequest';

describe('authDevicePairingExtension', () => {
  it('is the registered auth_device_pairing extension, with its auth pages and sign-in link', () => {
    expect(authDevicePairingExtension).toMatchObject({
      name: 'auth_device_pairing',
      serverExtension: 'auth_device_pairing',
    });
    expect(authDevicePairingExtension.displayName).toBe(registered.displayName);
    expect(authDevicePairingExtension.authPages).toEqual([
      { path: '/pair', component: PairRequest },
      { path: '/pair/approve', component: PairApprove, requiresSession: true },
    ]);
    expect(authDevicePairingExtension.signInAlternatives).toEqual([{ label: 'Sign in with another device', path: '/pair' }]);
  });
});
