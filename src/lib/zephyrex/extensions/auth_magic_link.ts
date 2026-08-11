// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authMagicLinkExtension: ZephyrexClientExtension = {
  name: 'auth_magic_link',
  displayName: 'Auth Magic Link',
  serverExtension: 'auth_magic_link',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Magic Link' }),
};
