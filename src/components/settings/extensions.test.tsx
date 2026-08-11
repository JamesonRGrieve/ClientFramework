// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';

describe('extensions', () => {
  it('module exports', async () => {
    const mod = await import('./extensions');
    expect(mod).toBeDefined();
  });
});
