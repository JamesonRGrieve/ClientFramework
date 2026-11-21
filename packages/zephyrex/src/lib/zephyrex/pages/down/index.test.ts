// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as down from './index';

describe('zephyrex/pages/down', () => {
  it('publishes the down page and its path', () => {
    expect(Object.keys(down).sort()).toEqual(['DOWN_PATH', 'DownPage']);
    expect(down.DOWN_PATH).toBe('/down');
  });
});
