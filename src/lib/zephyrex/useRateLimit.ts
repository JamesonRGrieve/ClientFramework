// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/errors';
import { RateLimitError } from './client';

const MS_PER_SECOND = 1000;
/** A 429 without Retry-After still backs off this long. */
export const DEFAULT_RATE_LIMIT_MS = 1000;
/** How often the remaining wait is re-counted while limited. */
const COUNTDOWN_TICK_MS = 500;
const TOO_MANY_REQUESTS = 429;

/**
 * How long to back off after `err`, or null when it isn't a rate limit: ZephyrexClient's
 * RateLimitError (after its own retries) or the REST client's 429, whose Retry-After is in seconds.
 */
export function rateLimitDelay(err: Error): number | null {
  if (err instanceof RateLimitError) {
    return err.retryAfterMs;
  }
  if (err instanceof ApiError && err.status === TOO_MANY_REQUESTS) {
    return err.retryAfter === undefined ? DEFAULT_RATE_LIMIT_MS : err.retryAfter * MS_PER_SECOND;
  }
  return null;
}

interface RateLimitState {
  isLimited: boolean;
  retryAfterMs: number;
  remainingMs: number;
}

const NOT_LIMITED: RateLimitState = { isLimited: false, retryAfterMs: 0, remainingMs: 0 };

export function useRateLimit(): RateLimitState & { reportError: (err: Error) => void } {
  const [state, setState] = useState<RateLimitState>(NOT_LIMITED);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const expiresAtRef = useRef(0);

  const report = useCallback((err: Error): void => {
    const retryAfterMs = rateLimitDelay(err);
    if (retryAfterMs === null) {
      return;
    }
    expiresAtRef.current = Date.now() + retryAfterMs;
    setState({ isLimited: true, retryAfterMs, remainingMs: retryAfterMs });
  }, []);

  useEffect(() => {
    if (!state.isLimited) {
      return undefined;
    }
    const stop = (): void => {
      if (timerRef.current !== undefined) {
        clearInterval(timerRef.current);
      }
    };
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, expiresAtRef.current - Date.now());
      if (remaining <= 0) {
        setState(NOT_LIMITED);
        stop();
        return;
      }
      setState((prev) => ({ ...prev, remainingMs: remaining }));
    }, COUNTDOWN_TICK_MS);
    return stop;
  }, [state.isLimited]);

  return { ...state, reportError: report };
}
