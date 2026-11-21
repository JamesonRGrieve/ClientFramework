// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RETRY_INTERVAL_MS, useRetryCountdown } from './useRetryCountdown';

const SECOND = 1000;

describe('useRetryCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down 10 s, tries, and starts again when the try fails', async () => {
    const retry = vi.fn(async () => Promise.reject(new Error('still down')));
    const { result } = renderHook(() => useRetryCountdown(retry));
    expect([result.current.secondsLeft, result.current.totalSeconds]).toEqual([10, 10]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3 * SECOND);
    });
    expect(result.current.secondsLeft).toBe(7);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RETRY_INTERVAL_MS - 3 * SECOND);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(retry).toHaveBeenCalledOnce();
    expect([result.current.retrying, result.current.secondsLeft]).toEqual([false, 10]);
  });

  it('tries at once on demand, and not at all while disabled', async () => {
    const retry = vi.fn(async () => Promise.resolve());
    const { result, rerender } = renderHook(({ enabled }) => useRetryCountdown(retry, { enabled }), {
      initialProps: { enabled: false },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RETRY_INTERVAL_MS * 2);
    });
    expect(retry).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await act(async () => {
      result.current.retryNow();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(retry).toHaveBeenCalledOnce();
  });
});
