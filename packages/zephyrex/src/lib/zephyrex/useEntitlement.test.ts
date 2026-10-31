// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Entitlement, ENTITLEMENT_PATH, hasFeature, limitOf, useEntitlement, withinLimit } from './useEntitlement';
import { fetchFrom } from '@/testing/msw';
import { TestWrapper } from '@/testing/TestWrapper';

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
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the signed-in user's plan", async () => {
    vi.stubGlobal('fetch', vi.fn(fetchFrom([http.get(`*${ENTITLEMENT_PATH}`, () => HttpResponse.json(FREE))])));
    const { result } = renderHook(() => useEntitlement(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual(FREE);
    });
  });
});
