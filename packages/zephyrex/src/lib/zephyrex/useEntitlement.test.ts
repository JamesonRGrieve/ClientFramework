// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Entitlement, ENTITLEMENT_PATH, hasFeature, limitOf, useEntitlement, withinLimit } from './useEntitlement';
import { type Call, recordingFetch, serverExtensions } from '@/testing/msw';
import { withSession } from '@/testing/session';
import { TestWrapper } from '@/testing/TestWrapper';

const SETTLE_MS = 50;

/** Waits long enough for a request the hook should not make to have been made. */
const settle = async (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, SETTLE_MS);
  });

const FREE: Entitlement = {
  plan: 'basic',
  features: ['map'],
  limits: { people: 10, storage_gb: null },
  seats: 0,
  seats_given: 0,
  via_seat_from: null,
};

describe('entitlement helpers', () => {
  it('reads features and limits, an unnamed limit being 0 and null unlimited', () => {
    expect(hasFeature(FREE, 'map')).toBe(true);
    expect(hasFeature(FREE, 'calendar_sync')).toBe(false);
    expect(limitOf(FREE, 'people')).toBe(10);
    expect(limitOf(FREE, 'storage_gb')).toBeNull();
    expect(limitOf(FREE, 'polycules')).toBe(0);
  });

  it('checks a count against a limit', () => {
    expect(withinLimit(FREE, 'people', 10)).toBe(true);
    expect(withinLimit(FREE, 'people', 11)).toBe(false);
    expect(withinLimit(FREE, 'storage_gb', 5000)).toBe(true);
    expect(withinLimit(FREE, 'polycules', 1)).toBe(false);
  });
});

describe('useEntitlement', () => {
  let signOut: (() => void) | undefined;

  afterEach(() => {
    signOut?.();
    signOut = undefined;
    vi.unstubAllGlobals();
  });

  /** Serves `FREE` as the plan, from a server running `extensions`; returns what was asked. */
  function serve(...extensions: string[]): Call[] {
    const recording = recordingFetch([
      serverExtensions(...extensions),
      http.get(`*${ENTITLEMENT_PATH}`, () => HttpResponse.json(FREE)),
    ]);
    vi.stubGlobal('fetch', vi.fn(recording.fetch));
    return recording.calls;
  }

  const askedForThePlan = (calls: readonly Call[]): boolean => calls.some((call) => call.url.includes(ENTITLEMENT_PATH));

  it("reads the signed-in user's plan from a server that sells plans", async () => {
    signOut = withSession();
    serve('entitlements');
    const { result } = renderHook(() => useEntitlement(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual(FREE);
    });
  });

  it('never asks a server whose extensions do not include entitlements', async () => {
    signOut = withSession();
    const calls = serve('live_sync');
    const { result } = renderHook(() => useEntitlement(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(calls.some((call) => call.url.includes('/v1/extension'))).toBe(true);
    });
    await settle();
    expect(askedForThePlan(calls)).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('never asks when the app says plans do not apply (enabled: false)', async () => {
    signOut = withSession();
    const calls = serve('entitlements');
    const { result } = renderHook(() => useEntitlement({ enabled: false }), { wrapper: TestWrapper });
    await settle();
    expect(askedForThePlan(calls)).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('still asks while signed out, as it always did', async () => {
    serve();
    const { result } = renderHook(() => useEntitlement(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual(FREE);
    });
  });

  it('still asks a server (or a mock) that lists no extensions', async () => {
    signOut = withSession();
    serve();
    const { result } = renderHook(() => useEntitlement(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual(FREE);
    });
  });
});
