// SPDX-License-Identifier: AGPL-3.0-or-later
// What the server's media extension answers on /v1/watch-lists: catalogue titles, the lists
// someone keeps or is on with their titles and who wants each, and tonight's pick.
import { z } from 'zod';

export const MediaItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.string(),
  year: z.number().nullish(),
  overview: z.string().nullish(),
  url: z.string().nullish(),
  image: z.string().nullish(),
});
export type MediaItem = z.infer<typeof MediaItemSchema>;

export const TitleSchema = MediaItemSchema.extend({
  title_id: z.string(),
  added_by: z.string().nullish(),
  watched_on: z.string().nullish(),
  wanted_by: z.array(z.string()),
});
export type Title = z.infer<typeof TitleSchema>;

export const WatchListSchema = z.object({
  id: z.string(),
  name: z.string(),
  keeper_id: z.string(),
  member_ids: z.array(z.string()),
  titles: z.array(TitleSchema),
});
export type WatchList = z.infer<typeof WatchListSchema>;

export const PickSchema = z.object({
  title: TitleSchema.nullish(),
  everyone: z.boolean(),
  wanted_by: z.number(),
  of: z.number(),
});
export type TonightPick = z.infer<typeof PickSchema>;

/** Someone a list can be shared with: their account and what to call them. */
export interface MediaPerson {
  userId: string;
  name: string;
}

/** Everyone on a list: its keeper, then its members. */
export function everyoneOn(list: Pick<WatchList, 'keeper_id' | 'member_ids'>): string[] {
  return [list.keeper_id, ...list.member_ids];
}

/** A title with its year, e.g. "The Matrix (1999)". */
export function titleLabel(item: Pick<MediaItem, 'title' | 'year'>): string {
  return item.year === null || item.year === undefined ? item.title : `${item.title} (${String(item.year)})`;
}
