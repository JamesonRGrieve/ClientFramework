// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

export const x509ConsumerExtension: ZephyrexClientExtension = {
  name: 'x509_consumer',
  displayName: 'X509 Consumer',
  serverExtension: 'x509_consumer',
  settingsPanel: () => AutoSettingsPanel({ extensionName: 'X509 Consumer' }),
};
