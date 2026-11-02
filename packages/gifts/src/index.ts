// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's gifts extension (zephyrex[gifts]): a private list of gift ideas
// for the people in someone's life, with links to the shop.
export { giftsExtension } from './extension';
export { GIFT_ENDPOINT, giftsApi, useGifts, useShopLink } from './giftsApi';
export type { NewGift } from './giftsApi';
export { GiftSchema, STATUSES, statusLabel } from './giftsModel';
export type { Gift, GiftIdea, GiftPerson, GiftStatus } from './giftsModel';
export { GiftsPage } from './GiftsPage';
export type { GiftsPageProps } from './GiftsPage';
export { GIFTS_PATH } from './routes';
