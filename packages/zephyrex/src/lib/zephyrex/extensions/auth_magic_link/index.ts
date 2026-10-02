// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// @zephyrex/auth-magic-link extends this entry to turn on the auth pages' magic-link sign-in.
export const authMagicLinkExtension = createExtension('auth_magic_link', {
  displayName: 'Magic Link Login',
  description: 'Passwordless authentication via email links',
});
