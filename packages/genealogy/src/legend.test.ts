// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { TIE_LEGEND } from './legend';

describe('TIE_LEGEND', () => {
  it('names each kind of tie once, partnerships first', () => {
    const kinds = TIE_LEGEND.map((entry) => entry.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    expect(kinds[0]).toBe('partnership');
    expect(kinds).toContain('friendship');
    expect(TIE_LEGEND.every((entry) => entry.label.trim() !== '')).toBe(true);
  });
});
