// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { nth } from './nth';

describe('nth', () => {
  it('picks an item by place, from the end when negative', () => {
    expect(nth(['a', 'b', 'c'], 1)).toBe('b');
    expect(nth(['a', 'b', 'c'], -1)).toBe('c');
  });

  it('names a place there is no item at as a mistake', () => {
    expect(() => nth(['a'], 2)).toThrow('Expected an item at 2 of 1');
  });
});
