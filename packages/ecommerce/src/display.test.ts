// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { amount, linkTarget, shownTime, statusLabel } from './display';

describe('store display', () => {
  it('shows an amount exactly as the store wrote it, with its currency', () => {
    expect(amount('42.50', 'CAD')).toBe('42.50 CAD');
    expect(amount('0.10', null)).toBe('0.10');
    expect(amount(null, 'CAD')).toBe('—');
    expect(amount('', 'CAD')).toBe('—');
  });

  it('links only to web addresses', () => {
    expect(linkTarget('https://shop.example.com/p/1')).toBe('https://shop.example.com/p/1');
    expect(linkTarget('ftp://files.example.com/print.png')).toBeNull();
    expect(linkTarget('not a url')).toBeNull();
    expect(linkTarget(null)).toBeNull();
  });

  it('names a status in words, and a time in the user’s own', () => {
    expect(statusLabel('shipped')).toBe('Shipped');
    expect(shownTime('2026-09-20T15:00:00')).toBe(new Date('2026-09-20T15:00:00Z').toLocaleString());
    expect(shownTime(null)).toBe('—');
    expect(shownTime('someday')).toBe('someday');
  });
});
