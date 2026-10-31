// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { entitlementsExtension } from './index';

describe('entitlementsExtension', () => {
  it('pairs with the server extension of the same name and adds no pages of its own', () => {
    expect(entitlementsExtension.name).toBe('entitlements');
    expect(entitlementsExtension.displayName).toBe('Entitlements');
    expect(entitlementsExtension.pages ?? []).toEqual([]);
  });
});
