// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const authMagicLinkExtension: ZephyrexClientExtension = {
  name: 'auth_magic_link',
  displayName: 'Magic Link Login',
  description: 'Passwordless authentication via email links',
  serverExtension: 'auth_magic_link',
};
