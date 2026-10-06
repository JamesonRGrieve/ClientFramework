// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { CHAINS_PATH, chainPagePath } from './routes';

describe('chain routes', () => {
  it('puts each chain under the chains page, its id escaped', () => {
    expect(CHAINS_PATH).toBe('/chains');
    expect(chainPagePath('a b')).toBe('/chains/a%20b');
  });
});
