// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatTimeAgo } from './time-ago';

const NOW = new Date('2026-09-30T12:00:00Z');

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats a date or an ISO string relative to now, briefly by default', () => {
    expect(formatTimeAgo(new Date('2026-09-30T11:55:00Z'))).toBe('5m');
    expect(formatTimeAgo('2026-09-30T09:00:00Z')).toBe('3h');
  });

  it('uses the style asked for', () => {
    expect(formatTimeAgo(new Date('2026-09-30T11:55:00Z'), 'round')).toBe('5 minutes ago');
  });

  it('is empty for no date or one it cannot read', () => {
    expect(formatTimeAgo('')).toBe('');
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    expect(formatTimeAgo('not a date')).toBe('');
    consoleLog.mockRestore();
  });
});
