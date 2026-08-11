// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';

describe('DropZone', () => {
  it('module exports', async () => {
    const mod = await import('./DropZone');
    expect(mod).toBeDefined();
  });
});
