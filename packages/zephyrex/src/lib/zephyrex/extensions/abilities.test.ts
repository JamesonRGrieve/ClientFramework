// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { abilityExtensions } from './abilities';

describe('abilityExtensions', () => {
  it('each pairs with its server extension by name, named and described, with no client pages or sections', () => {
    expect(abilityExtensions.map((extension) => extension.name)).toEqual([
      'cloud',
      'maps',
      'math',
      'media',
      'messaging',
      'sms',
      'source',
      'wearable',
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
