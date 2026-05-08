'use client';

import { useEffect, useRef, useState } from 'react';
import { getApiClient } from '@/lib/api/client';
import { pollTracking } from '@/lib/api/outbox';
import type { OperationTracking } from '@/lib/api/types';

export interface UseOutboxResult {
  state: OperationTracking | null;
  error: Error | null;
  done: boolean;
}

/**
 * Subscribes to /v1/outbox/{trackingId} and reports state transitions until
 * terminal. Pass `null` to disable. Mirrors EP_Outbox on the server.
 */
export function useOutbox(trackingId: string | null): UseOutboxResult {
  const [state, setState] = useState<OperationTracking | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [done, setDone] = useState(false);
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (trackingId === null) {
      setState(null);
      setError(null);
      setDone(false);
      lastIdRef.current = null;
      return;
    }
    if (trackingId === lastIdRef.current) return;
    lastIdRef.current = trackingId;
    setError(null);
    setDone(false);

    const controller = new AbortController();
    pollTracking(getApiClient(), trackingId, {
      signal: controller.signal,
      onUpdate: setState,
    })
      .then((final) => {
        setState(final);
        setDone(true);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    return (): void => controller.abort();
  }, [trackingId]);

  return { state, error, done };
}
