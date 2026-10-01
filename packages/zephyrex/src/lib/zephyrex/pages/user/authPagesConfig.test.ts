// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { authPagesConfig } from './authPagesConfig';

describe('authPagesConfig', () => {
  it('defaults to password sign-in at /user with no identity providers', () => {
    expect(authPagesConfig({ app: { name: 'Zephyreader' } })).toEqual({
      appName: 'Zephyreader',
      authPath: '/user',
      authModes: { basic: true, magical: false },
      oauthProviders: [],
    });
  });

  it('carries an OAuth-only setup from the config', () => {
    expect(
      authPagesConfig({
        app: { name: 'Zephyreader' },
        auth: {
          authPath: '/account',
          authModes: { basic: false, magical: false },
          oauthProviders: ['google'],
          recaptchaSiteKey: 'site-key',
        },
      }),
    ).toEqual({
      appName: 'Zephyreader',
      authPath: '/account',
      authModes: { basic: false, magical: false },
      oauthProviders: ['google'],
      recaptchaSiteKey: 'site-key',
    });
  });
});
