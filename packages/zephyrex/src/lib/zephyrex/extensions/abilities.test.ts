// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { abilityExtensions } from './abilities';

describe('abilityExtensions', () => {
  it('each pairs with its server extension by name, named and described, with no client pages or sections', () => {
    expect(abilityExtensions.map((extension) => extension.name)).toEqual([
      'ai',
      'automotive',
      'cad',
      'calendar',
      'cloud',
      'crypto',
      'fdm_sla_printing',
      'local_ai',
      'local_ai_gguf',
      'local_ai_torch',
      'maps',
      'math',
      'mcp_client',
      'media',
      'messaging',
      'sms',
      'source',
      'wearable',
      'websearch',
      'wiki',
    ]);
    for (const extension of abilityExtensions) {
      expect(extension.serverExtension).toBe(extension.name);
      expect(extension.displayName).not.toBe('');
      expect(extension.description).not.toBe('');
      expect(extension.pages).toBeUndefined();
      expect(extension.managementTabs).toBeUndefined();
    }
  });
});
