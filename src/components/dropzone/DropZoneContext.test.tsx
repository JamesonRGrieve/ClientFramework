// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';

describe('DropZoneContext', () => {
  it('module exports', async () => {
    const mod = await import('./DropZoneContext');
    expect(mod).toBeDefined();
  });
});
