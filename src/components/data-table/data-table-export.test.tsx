// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';

describe('data-table-export', () => {
  it('module exports', async () => {
    const mod = await import('./data-table-export');
    expect(mod).toBeDefined();
  });
});
