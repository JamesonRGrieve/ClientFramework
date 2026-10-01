// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/auth-mfa', () => {
  it('publishes the two-factor section, its API and the extension that mounts it', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'MFA_ENDPOINT',
        'MfaMethodSchema',
        'MfaSettings',
        'TotpProvisioningSchema',
        'authMfaExtension',
        'mfaApi',
        'useMfaMethods',
      ].sort(),
    );
    expect(published.MFA_ENDPOINT).toBe('/v1/user/mfa');
  });
});
