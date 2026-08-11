// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';

describe('data-table-pagination', () => {
  it('module exports', async () => {
    const mod = await import('./data-table-pagination');
    expect(mod).toBeDefined();
  });
});
