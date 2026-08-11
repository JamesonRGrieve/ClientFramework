// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';

describe('Heading', () => {
  it('module exports', async () => {
    const mod = await import('./Heading');
    expect(mod).toBeDefined();
  });
});
