// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { AutoSettingsPanel } from '../ExtensionRegistry';

function toDisplayName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function createExtension(
  name: string,
  overrides?: Partial<Omit<ZephyrexClientExtension, 'name' | 'serverExtension'>>,
): ZephyrexClientExtension {
  const displayName = overrides?.displayName ?? toDisplayName(name);
  return {
    name,
    serverExtension: name,
    displayName,
    settingsPanel: () => AutoSettingsPanel({ extensionName: displayName }),
    ...overrides,
  };
}
