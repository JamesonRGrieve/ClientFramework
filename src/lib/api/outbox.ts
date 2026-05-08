import { ApiClient } from './client';
import type { OperationTracking } from './types';

const POLL_INTERVAL_MS = 750;
const POLL_BACKOFF_FACTOR = 1.4;
const POLL_MAX_INTERVAL_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 60_000;

export interface PollOptions {
  intervalMs?: number;
  maxIntervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onUpdate?: (state: OperationTracking) => void;
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new DOMException('aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });

/**
 * Polls /v1/outbox/{tracking_id} until terminal (`complete` or `dlq`).
 * Mirrors EP_Outbox.create_outbox_router on the server.
 */
export async function pollTracking(
  client: ApiClient,
  trackingId: string,
  options: PollOptions = {},
): Promise<OperationTracking> {
  const start = Date.now();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxInterval = options.maxIntervalMs ?? POLL_MAX_INTERVAL_MS;
  let interval = options.intervalMs ?? POLL_INTERVAL_MS;

  while (true) {
    const response = await client.get<OperationTracking>(`/v1/outbox/${encodeURIComponent(trackingId)}`, {
      signal: options.signal,
    });
    const state = response.data;
    options.onUpdate?.(state);
    if (state.state === 'complete' || state.state === 'dlq') return state;
    if (Date.now() - start >= timeoutMs) return state;
    await sleep(Math.min(interval, maxInterval), options.signal);
    interval = Math.min(interval * POLL_BACKOFF_FACTOR, maxInterval);
  }
}
