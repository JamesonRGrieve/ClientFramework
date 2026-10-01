// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { formatByteSize } from './byte-size';

const LOCALE = 'en-US';

describe('formatByteSize', () => {
  it('shows small sizes in whole bytes', () => {
    expect(formatByteSize(0, LOCALE)).toBe('0 bytes');
    expect(formatByteSize(1, LOCALE)).toBe('1 byte');
    expect(formatByteSize(999, LOCALE)).toBe('999 bytes');
  });

  it('moves to the largest decimal unit the size reaches, to one decimal place', () => {
    expect(formatByteSize(1_000, LOCALE)).toBe('1 kB');
    expect(formatByteSize(1_536_000, LOCALE)).toBe('1.5 MB');
    expect(formatByteSize(2_000_000_000, LOCALE)).toBe('2 GB');
  });

  it('stays in gigabytes past a thousand of them', () => {
    expect(formatByteSize(5_000_000_000_000, LOCALE)).toBe('5,000 GB');
  });
});
