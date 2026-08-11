// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';

describe('Link', () => {
  it('module exports', async () => {
    const mod = await import('./Link');
    expect(mod).toBeDefined();
  });
});
