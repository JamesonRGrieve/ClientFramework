// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';

describe('data-table-view-options', () => {
  it('module exports', async () => {
    const mod = await import('./data-table-view-options');
    expect(mod).toBeDefined();
  });
});
