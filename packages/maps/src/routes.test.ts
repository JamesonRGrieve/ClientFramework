// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { MEET_PATH } from './routes';

describe('maps routes', () => {
  it('mounts meeting in the middle at /meet', () => {
    expect(MEET_PATH).toBe('/meet');
  });
});
