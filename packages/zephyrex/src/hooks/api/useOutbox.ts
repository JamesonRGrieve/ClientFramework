// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useEffect, useState } from 'react';
import { getApiClient } from '@/lib/api/client';
import { pollTracking } from '@/lib/api/outbox';
import type { OperationTracking } from '@/lib/api/types';

export interface UseOutboxResult {
  state: OperationTracking | null;
  error: Error | null;
  done: boolean;
}

const IDLE: UseOutboxResult = { state: null, error: null, done: false };

/** What polling one tracking id has reported so far. */
interface Progress extends UseOutboxResult {
  trackingId: string;
}

/**
 * Subscribes to /v1/outbox/{trackingId} and reports state transitions until
 * terminal. Pass `null` to disable. Mirrors EP_Outbox on the server.
 */
export function useOutbox(trackingId: string | null): UseOutboxResult {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    if (trackingId === null) {
      return undefined;
    }
    const report = (update: Partial<UseOutboxResult>): void => {
      setProgress((current) => ({
        ...(current?.trackingId === trackingId ? current : { ...IDLE, trackingId }),
        ...update,
      }));
    };

    const controller = new AbortController();
    pollTracking(getApiClient(), trackingId, {
      signal: controller.signal,
      onUpdate: (state) => report({ state }),
    })
      .then((final) => report({ state: final, done: true }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        report({ error: err instanceof Error ? err : new Error(String(err)) });
      });

    return (): void => controller.abort();
  }, [trackingId]);

  if (trackingId === null || progress?.trackingId !== trackingId) {
    return IDLE;
  }
  return { state: progress.state, error: progress.error, done: progress.done };
}
