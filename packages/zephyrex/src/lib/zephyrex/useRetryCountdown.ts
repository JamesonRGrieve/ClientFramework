// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** How long a failed load or a down server waits before trying again (the operator's 10 s, fixed). */
export const RETRY_INTERVAL_MS = 10_000;
const TICK_MS = 1000;

export interface RetryCountdown {
  /** Whole seconds until the next try; the full count again after each one. */
  secondsLeft: number;
  totalSeconds: number;
  /** Whether a try is under way. */
  retrying: boolean;
  /** Tries now, and starts the count again when it ends. */
  retryNow: () => void;
}

/**
 * Tries `retry` again every `intervalMs` (10 s by default) for as long as it stays mounted and
 * enabled, counting down whole seconds. A try that succeeds normally unmounts the caller (the data
 * arrived, the page loads); one that fails starts the count again.
 */
export function useRetryCountdown(
  retry: () => Promise<unknown>,
  { intervalMs = RETRY_INTERVAL_MS, enabled = true }: { intervalMs?: number; enabled?: boolean } = {},
): RetryCountdown {
  const totalSeconds = Math.max(1, Math.round(intervalMs / TICK_MS));
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [retrying, setRetrying] = useState(false);
  const retryRef = useRef(retry);
  const busy = useRef(false);
  useEffect(() => {
    retryRef.current = retry;
  }, [retry]);

  const retryNow = useCallback((): void => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setRetrying(true);
    void retryRef
      .current()
      .catch(() => undefined)
      .finally(() => {
        busy.current = false;
        setRetrying(false);
        setSecondsLeft(totalSeconds);
      });
  }, [totalSeconds]);

  // One tick a second while counting; a functional update, so ticks never depend on a re-render.
  useEffect(() => {
    if (!enabled || retrying) {
      return undefined;
    }
    const timer = setInterval(() => {
      setSecondsLeft((left) => left - 1);
    }, TICK_MS);
    return (): void => clearInterval(timer);
  }, [enabled, retrying]);

  // At zero, try.
  useEffect(() => {
    if (enabled && !retrying && secondsLeft <= 0) {
      retryNow();
    }
  }, [enabled, retrying, secondsLeft, retryNow]);

  return { secondsLeft: Math.max(secondsLeft, 1), totalSeconds, retrying, retryNow };
}
