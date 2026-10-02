// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { authMagicLinkExtension as registered } from 'zephyrex/extensions/auth_magic_link';
import { authMagicLinkExtension } from './extension';

describe('authMagicLinkExtension', () => {
  it('is the registered auth_magic_link extension, turning magic-link sign-in on', () => {
    expect(authMagicLinkExtension).toMatchObject({ name: 'auth_magic_link', serverExtension: 'auth_magic_link' });
    expect(authMagicLinkExtension.displayName).toBe(registered.displayName);
    expect(authMagicLinkExtension.authModes).toEqual({ magical: true });
  });
});
