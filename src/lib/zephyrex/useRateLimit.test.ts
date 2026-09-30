// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/errors';
import { RateLimitError } from './client';
import { DEFAULT_RATE_LIMIT_MS, rateLimitDelay, useRateLimit } from './useRateLimit';

const HTTP_TOO_MANY = 429;
const HTTP_NOT_FOUND = 404;

describe('rateLimitDelay', () => {
  it('reads either client’s rate limit, in milliseconds', () => {
    expect(rateLimitDelay(new RateLimitError(2500, 'slow down'))).toBe(2500);
    expect(rateLimitDelay(new ApiError({ status: HTTP_TOO_MANY, detail: 'slow down', retryAfter: 3 }))).toBe(3000);
    expect(rateLimitDelay(new ApiError({ status: HTTP_TOO_MANY, detail: 'slow down' }))).toBe(DEFAULT_RATE_LIMIT_MS);
  });

  it('ignores every other failure', () => {
    expect(rateLimitDelay(new ApiError({ status: HTTP_NOT_FOUND, detail: 'Not found' }))).toBeNull();
    expect(rateLimitDelay(new Error('boom'))).toBeNull();
  });
});

describe('useRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('holds the limit for the server’s Retry-After, counting down, then lifts it', () => {
    const { result } = renderHook(() => useRateLimit());
    act(() => {
      result.current.reportError(new RateLimitError(2000, 'slow down'));
    });
    expect(result.current.isLimited).toBe(true);
    expect(result.current.remainingMs).toBe(2000);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remainingMs).toBeLessThanOrEqual(1000);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.isLimited).toBe(false);
  });

  it('does nothing for errors that are not rate limits', () => {
    const { result } = renderHook(() => useRateLimit());
    act(() => {
      result.current.reportError(new Error('boom'));
    });
    expect(result.current.isLimited).toBe(false);
  });
});
