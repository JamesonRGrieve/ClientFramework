// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { ROTA_PATH } from './routes';

describe('rota routes', () => {
  it('mounts the rota at /rota', () => {
    expect(ROTA_PATH).toBe('/rota');
  });
});
