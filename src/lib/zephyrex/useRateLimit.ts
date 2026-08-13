// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RateLimitError } from './client';

interface RateLimitState {
  isLimited: boolean;
  retryAfterMs: number;
  remainingMs: number;
}

export function useRateLimit(): RateLimitState & { reportError: (err: unknown) => void } {
  const [state, setState] = useState<RateLimitState>({
    isLimited: false,
    retryAfterMs: 0,
    remainingMs: 0,
  });
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const expiresAtRef = useRef(0);

  const reportError = useCallback((err: unknown) => {
    if (err instanceof RateLimitError) {
      const expiresAt = Date.now() + err.retryAfterMs;
      expiresAtRef.current = expiresAt;
      setState({
        isLimited: true,
        retryAfterMs: err.retryAfterMs,
        remainingMs: err.retryAfterMs,
      });
    }
  }, []);

  useEffect(() => {
    if (!state.isLimited) return undefined;

    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, expiresAtRef.current - Date.now());
      if (remaining <= 0) {
        setState({ isLimited: false, retryAfterMs: 0, remainingMs: 0 });
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      setState((prev) => ({ ...prev, remainingMs: remaining }));
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isLimited]);

  return { ...state, reportError };
}
