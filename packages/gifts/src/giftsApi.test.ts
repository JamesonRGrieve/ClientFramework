// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { testConfig } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { giftsApi } from './giftsApi';
import { emptyGiftsStore, giftsHandlers } from './gifts.mocks';

describe('giftsApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds a gift, moves it along and deletes it', async () => {
    const store = emptyGiftsStore();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(giftsHandlers(store))));
    const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });
    const gift = await giftsApi.add(client, { for_name: 'Alex', for_ref: null, title: 'Scarf', url: null, note: null });
    expect(store.gifts).toMatchObject([{ title: 'Scarf', status: 'idea' }]);
    const bought = await giftsApi.setStatus(client, gift, 'bought');
    expect(bought.status).toBe('bought');
    await giftsApi.remove(client, bought);
    expect(store.gifts).toEqual([]);
  });
});
