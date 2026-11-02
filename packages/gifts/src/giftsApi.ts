// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { useClient, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';
import { type Gift, GiftSchema, type GiftStatus, ShopLinkSchema } from './giftsModel';

export const GIFT_ENDPOINT = '/v1/gift';
const SHOP_LINK = '/v1/gifts/shop-link';

/** The signed-in user's own gift ideas. */
export function useGifts(): SWRResponse<Gift[], Error> {
  const client = useClient();
  return useSWR<Gift[], Error>(client.url(GIFT_ENDPOINT), async () => client.list(GIFT_ENDPOINT, 'gifts', GiftSchema));
}

/** A search at the shop for `query`, carrying the operator's tag; nothing until there is a query. */
export function useShopLink(query: string | null): SWRResponse<string, Error> {
  const client = useClient();
  const params = query === null || query.trim() === '' ? null : { q: query.trim() };
  return useSWR<string, Error>(
    params === null ? null : client.url(SHOP_LINK, params),
    async () => ShopLinkSchema.parse(await client.get(SHOP_LINK, params ?? {})).url,
  );
}

/** A type, not an interface: it is sent as a JSON body, whose type needs an index signature. */
export type NewGift = {
  for_name: string;
  for_ref: string | null;
  title: string;
  url: string | null;
  note: string | null;
};

const Envelope = z.object({ gift: GiftSchema });
const giftPath = (gift: Gift): string => `${GIFT_ENDPOINT}/${encodeURIComponent(gift.id)}`;

export const giftsApi = {
  add: async (client: ZephyrexClient, gift: NewGift): Promise<Gift> =>
    Envelope.parse(await client.post(GIFT_ENDPOINT, { gift })).gift,
  /** Moves the gift along (idea, bought, given), guarded by its version. */
  setStatus: async (client: ZephyrexClient, gift: Gift, status: GiftStatus): Promise<Gift> =>
    Envelope.parse(await client.put(giftPath(gift), { gift: { status } }, gift)).gift,
  remove: async (client: ZephyrexClient, gift: Gift): Promise<void> => {
    await client.delete(giftPath(gift), gift);
  },
};
