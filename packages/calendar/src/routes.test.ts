// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { AVAILABILITY_PATH } from './routes';

describe('calendar routes', () => {
  it('mounts shared availability at /availability', () => {
    expect(AVAILABILITY_PATH).toBe('/availability');
  });
});
