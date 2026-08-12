// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const oauthConsumerExtension: ZephyrexClientExtension = {
  name: 'oauth_consumer',
  displayName: 'Oauth Consumer',
  serverExtension: 'oauth_consumer',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Oauth Consumer' }),
};
