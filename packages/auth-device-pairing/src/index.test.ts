// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/auth-device-pairing', () => {
  it('publishes the pairing pages, their API and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'PAIRING_ENDPOINT',
        'PAIRING_POLL_MS',
        'PairApprove',
        'PairRequest',
        'answerPairing',
        'authDevicePairingExtension',
        'pairingStatus',
        'requestPairing',
      ].sort(),
    );
    expect(published.PAIRING_ENDPOINT).toBe('/v1/auth/pairing');
  });
});
