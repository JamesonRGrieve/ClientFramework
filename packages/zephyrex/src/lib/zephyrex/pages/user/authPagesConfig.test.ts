// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { authPagesConfig, extensionAuthPages, sessionOnlyAuthPaths } from './authPagesConfig';

const APP = { name: 'Zephyreader' };

describe('authPagesConfig', () => {
  it('defaults to password sign-in at /user with no identity providers', () => {
    expect(authPagesConfig({ app: APP })).toEqual({
      appName: 'Zephyreader',
      authPath: '/user',
      authModes: { basic: true, magical: false },
      oauthProviders: [],
      signInAlternatives: [],
    });
  });

  it('carries an OAuth-only setup from the config', () => {
    expect(
      authPagesConfig({
        app: APP,
        auth: {
          authPath: '/account',
          authModes: { basic: false },
          oauthProviders: ['google'],
          recaptchaSiteKey: 'site-key',
        },
      }),
    ).toEqual({
      appName: 'Zephyreader',
      authPath: '/account',
      authModes: { basic: false, magical: false },
      oauthProviders: ['google'],
      signInAlternatives: [],
      recaptchaSiteKey: 'site-key',
    });
  });

  it('turns magic-link sign-in on only when a registered extension does', () => {
    expect(authPagesConfig({ app: APP, extensions: [{ name: 'other' }] }).authModes).toEqual({
      basic: true,
      magical: false,
    });
    const magicLink = { name: 'auth_magic_link', authModes: { magical: true } };
    expect(authPagesConfig({ app: APP, auth: { authModes: { basic: false } }, extensions: [magicLink] }).authModes).toEqual({
      basic: false,
      magical: true,
    });
  });

  it('links the registered extensions’ other ways to sign in', () => {
    const pairing = { label: 'Sign in with another device', path: '/pair' };
    const extensions = [{ name: 'a', signInAlternatives: [pairing] }, { name: 'b' }];
    expect(authPagesConfig({ app: APP, extensions }).signInAlternatives).toEqual([pairing]);
  });
});

describe('the extensions’ auth pages', () => {
  const Page = (): null => null;
  const extensions = [
    {
      name: 'pairing',
      authPages: [
        { path: '/pair', component: Page },
        { path: '/pair/approve', component: Page, requiresSession: true },
      ],
    },
    { name: 'other' },
  ];

  it('lists every page the registered extensions add', () => {
    expect(extensionAuthPages({ extensions }).map((page) => page.path)).toEqual(['/pair', '/pair/approve']);
    expect(extensionAuthPages({})).toEqual([]);
  });

  it('puts the ones that need a session under the app’s auth path', () => {
    expect(sessionOnlyAuthPaths({ extensions })).toEqual(['/user/pair/approve']);
    expect(sessionOnlyAuthPaths({ auth: { authPath: '/account' }, extensions })).toEqual(['/account/pair/approve']);
  });
});
