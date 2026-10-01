// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOutbox } from './useOutbox';
import { configureApiClient } from '@/lib/api/client';
import type { OperationTracking } from '@/lib/api/types';

const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;
const IDLE = { state: null, error: null, done: false };

const trackingResponse = (tracking: OperationTracking): Response =>
  new Response(JSON.stringify(tracking), { status: HTTP_OK, headers: { 'Content-Type': 'application/json' } });

const trackingIdOf = (input: Parameters<typeof fetch>[0]): string => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return decodeURIComponent(url.split('/').pop() ?? '');
};

/** Answers every outbox read for `trackingId` with `answer`; any other id never answers. */
const serving = (trackingId: string, answer: () => Response): ReturnType<typeof vi.fn<typeof fetch>> =>
  vi.fn<typeof fetch>(async (input) =>
    trackingIdOf(input) === trackingId
      ? Promise.resolve(answer())
      : new Promise<Response>(() => {
          // Never settles: this id's operation is still running.
        }),
  );

describe('useOutbox', () => {
  it('is idle and reads nothing without a tracking id', () => {
    const fetchImpl = serving('t1', () => trackingResponse({ tracking_id: 't1', state: 'complete' }));
    configureApiClient({ fetchImpl });
    const { result } = renderHook(() => useOutbox(null));
    expect(result.current).toEqual(IDLE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports the terminal state and that the operation is done', async () => {
    configureApiClient({ fetchImpl: serving('t1', () => trackingResponse({ tracking_id: 't1', state: 'complete' })) });
    const { result } = renderHook(() => useOutbox('t1'));
    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current.state?.state).toBe('complete');
    expect(result.current.error).toBeNull();
  });

  it('reports a failed read as the error', async () => {
    configureApiClient({
      fetchImpl: serving(
        't1',
        () =>
          new Response(JSON.stringify({ detail: 'boom' }), {
            status: HTTP_SERVER_ERROR,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    });
    const { result } = renderHook(() => useOutbox('t1'));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.done).toBe(false);
  });

  it('forgets the previous operation as soon as the tracking id changes', async () => {
    configureApiClient({ fetchImpl: serving('t1', () => trackingResponse({ tracking_id: 't1', state: 'complete' })) });
    const initialProps: { id: string | null } = { id: 't1' };
    const { result, rerender } = renderHook(({ id }: { id: string | null }) => useOutbox(id), { initialProps });
    await waitFor(() => expect(result.current.done).toBe(true));
    rerender({ id: 't2' });
    expect(result.current).toEqual(IDLE);
    rerender({ id: null });
    expect(result.current).toEqual(IDLE);
  });
});
