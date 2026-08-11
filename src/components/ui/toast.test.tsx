// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';

describe('toast', () => {
  it('module exports', async () => {
    const mod = await import('./toast');
    expect(mod).toBeDefined();
  });
});
