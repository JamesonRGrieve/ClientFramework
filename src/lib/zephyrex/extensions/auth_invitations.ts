// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const authInvitationsExtension: ZephyrexClientExtension = {
  name: 'auth_invitations',
  displayName: 'Auth Invitations',
  serverExtension: 'auth_invitations',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Auth Invitations' }),
};
