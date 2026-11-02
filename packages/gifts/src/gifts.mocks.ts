// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory gifts server for the package's tests and stories (never compiled into dist): the
// user's gifts as a REST table, and links to the shop tagged the way the server tags them.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { restTable } from 'zephyrex/testing/msw';
import { type Gift, GiftSchema } from './giftsModel';

const FIXTURE_VERSION = '2026-10-01T09:00:00';
export const TAG = 'cule-20';

export interface GiftsStore {
  gifts: Gift[];
}

/** A scarf idea for Alex and flowers already bought for Sam. */
export function giftsFixture(): GiftsStore {
  return {
    gifts: [
      {
        id: 'g1',
        for_name: 'Alex',
        for_ref: 'p-alex',
        title: 'A silk scarf',
        url: null,
        note: 'Emerald',
        status: 'idea',
        created_at: FIXTURE_VERSION,
        updated_at: null,
      },
      {
        id: 'g2',
        for_name: 'Sam',
        for_ref: 'p-sam',
        title: 'Peonies',
        url: `https://www.amazon.ca/dp/B01?tag=${TAG}`,
        note: null,
        status: 'bought',
        created_at: FIXTURE_VERSION,
        updated_at: null,
      },
    ],
  };
}

export function emptyGiftsStore(): GiftsStore {
  return { gifts: [] };
}

export function giftsHandlers(store: GiftsStore = giftsFixture()): RequestHandler[] {
  return [
    http.get('*/v1/user', () => HttpResponse.json({ user: { id: 'u-me', email: 'me@example.com' } })),
    http.get('*/v1/gifts/shop-link', ({ request }) => {
      const query = new URL(request.url).searchParams.get('q') ?? '';
      return HttpResponse.json({ url: `https://www.amazon.ca/s?k=${encodeURIComponent(query)}&tag=${TAG}`, tagged: true });
    }),
    ...restTable<Gift>({
      rows: () => store.gifts,
      set: (rows) => {
        store.gifts = rows;
      },
      schema: GiftSchema,
      endpoint: '/v1/gift',
      single: 'gift',
      plural: 'gifts',
      filters: [],
      defaults: { status: 'idea' },
    }),
  ];
}
