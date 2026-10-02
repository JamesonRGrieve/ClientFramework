// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { authMagicLinkExtension as registered } from 'zephyrex/extensions/auth_magic_link';

/**
 * The auth_magic_link client extension, for an app's `extensions`: it turns on the auth pages'
 * magic-link sign-in. The welcome page then offers to email a sign-in link, and the link lands on
 * `<authPath>/magic`; point the server's MAGIC_LINK_BASE_URL there.
 */
export const authMagicLinkExtension: ZephyrexClientExtension = {
  ...registered,
  authModes: { magical: true },
};
