// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { AGREEMENTS_PATH } from './routes';

describe('agreements routes', () => {
  it('mounts agreements at /agreements', () => {
    expect(AGREEMENTS_PATH).toBe('/agreements');
  });
});
