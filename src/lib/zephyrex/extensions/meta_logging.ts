// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const metaLoggingExtension: ZephyrexClientExtension = {
  name: 'meta_logging',
  displayName: 'Meta Logging',
  serverExtension: 'meta_logging',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'Meta Logging' }),
};
