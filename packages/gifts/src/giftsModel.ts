// SPDX-License-Identifier: AGPL-3.0-or-later
// What the server's gifts extension answers: someone's own gift ideas, and links to the shop.
import { z } from 'zod';

export const STATUSES = ['idea', 'bought', 'given'] as const;
export type GiftStatus = (typeof STATUSES)[number];

export const GiftSchema = z.object({
  id: z.string(),
  for_name: z.string(),
  for_ref: z.string().nullish(),
  title: z.string(),
  url: z.string().nullish(),
  note: z.string().nullish(),
  status: z.enum(STATUSES),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});
export type Gift = z.infer<typeof GiftSchema>;

export const ShopLinkSchema = z.object({ url: z.string(), tagged: z.boolean() });

/** Someone a gift can be for: the app's record of them, and their name. */
export interface GiftPerson {
  ref: string;
  name: string;
}

/** A suggestion the app draws from what it knows about someone. */
export interface GiftIdea {
  forRef: string;
  forName: string;
  title: string;
  note?: string;
}

export function statusLabel(status: GiftStatus): string {
  switch (status) {
    case 'idea':
      return 'Idea';
    case 'bought':
      return 'Bought';
    case 'given':
      return 'Given';
  }
}
