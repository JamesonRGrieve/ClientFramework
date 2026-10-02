// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { authMagicLinkExtension } from './extension';
import * as published from './index';

describe('@zephyrex/auth-magic-link', () => {
  it('publishes the extension that turns magic-link sign-in on', () => {
    expect(Object.keys(published)).toEqual(['authMagicLinkExtension']);
    expect(published.authMagicLinkExtension).toBe(authMagicLinkExtension);
  });
});
