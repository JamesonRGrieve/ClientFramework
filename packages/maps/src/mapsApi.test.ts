// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { testConfig } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { findMidpoint } from './mapsApi';
import { mapsFixture, mapsHandlers } from './maps.mocks';

describe('findMidpoint', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks for the middle of the places, the mode and the kind of place, and reads the answer', async () => {
    const store = mapsFixture();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(mapsHandlers(store))));
    const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });
    const found = await findMidpoint(client, {
      locations: ['Edmonton', 'Calgary'],
      mode: 'walking',
      category: 'restaurant',
    });
    expect(store.asked).toEqual([{ locations: ['Edmonton', 'Calgary'], mode: 'walking', category: 'restaurant' }]);
    expect(found.legs.map((leg) => leg.location)).toEqual(['Edmonton', 'Calgary']);
    expect(found.places).toHaveLength(2);
  });
});
