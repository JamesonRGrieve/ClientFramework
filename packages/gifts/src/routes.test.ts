// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { GIFTS_PATH } from './routes';

describe('gifts routes', () => {
  it('mounts the gift list at /gifts', () => {
    expect(GIFTS_PATH).toBe('/gifts');
  });
});
