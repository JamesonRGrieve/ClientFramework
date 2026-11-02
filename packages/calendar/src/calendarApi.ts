// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { useClient, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';
import {
  AccountSchema,
  type AvailabilityShare,
  type Booked,
  BookedSchema,
  type CalendarAccount,
  type CalendarService,
  type FreeTime,
  FreeTimeSchema,
  ShareSchema,
} from './calendarModel';

export const CALENDARS_ENDPOINT = '/v1/calendars';
const ACCOUNTS = `${CALENDARS_ENDPOINT}/accounts`;
const SHARES = `${CALENDARS_ENDPOINT}/shares`;
const SHARED_WITH_ME = `${CALENDARS_ENDPOINT}/shared-with-me`;

const AccountListSchema = z.object({ accounts: z.array(AccountSchema) });
const ShareListSchema = z.object({ shares: z.array(ShareSchema) });

/** The signed-in user's own calendars. */
export function useCalendarAccounts(): SWRResponse<CalendarAccount[], Error> {
  const client = useClient();
  return useSWR<CalendarAccount[], Error>(
    client.url(ACCOUNTS),
    async () => AccountListSchema.parse(await client.get(ACCOUNTS)).accounts,
  );
}

/** Whom the user shares their availability with. */
export function useAvailabilityShares(): SWRResponse<AvailabilityShare[], Error> {
  const client = useClient();
  return useSWR<AvailabilityShare[], Error>(
    client.url(SHARES),
    async () => ShareListSchema.parse(await client.get(SHARES)).shares,
  );
}

/** Who shares their availability with the user, and who lets them book. */
export function useSharedWithMe(): SWRResponse<AvailabilityShare[], Error> {
  const client = useClient();
  return useSWR<AvailabilityShare[], Error>(
    client.url(SHARED_WITH_ME),
    async () => ShareListSchema.parse(await client.get(SHARED_WITH_ME)).shares,
  );
}

/** A type, not an interface: it is sent as a JSON body, whose type needs an index signature. */
export type NewAccount = {
  provider: CalendarService;
  label: string;
  calendar_url?: string;
  username?: string;
  password?: string;
  calendar_id?: string;
};

/** A type, not an interface: it is sent as a JSON body. */
export type FreeRequest = {
  user_ids: string[];
  first_day: string;
  days: number;
  duration_minutes: number;
  day_start: string;
  day_end: string;
  timezone: string;
};

/** A type, not an interface: it is sent as a JSON body. */
export type BookRequest = {
  title: string;
  start: string;
  end: string;
  location?: string;
  user_ids: string[];
};

export const calendarApi = {
  connect: async (client: ZephyrexClient, account: NewAccount): Promise<CalendarAccount> =>
    AccountSchema.parse(await client.post(ACCOUNTS, account)),
  disconnect: async (client: ZephyrexClient, account: CalendarAccount): Promise<void> => {
    await client.post(`${ACCOUNTS}/${encodeURIComponent(account.id)}/remove`, {});
  },
  share: async (client: ZephyrexClient, viewerUserId: string, canBook: boolean): Promise<void> => {
    await client.post(SHARES, { viewer_user_id: viewerUserId, can_book: canBook });
  },
  unshare: async (client: ZephyrexClient, viewerUserId: string): Promise<void> => {
    await client.post(`${SHARES}/${encodeURIComponent(viewerUserId)}/remove`, {});
  },
  findFree: async (client: ZephyrexClient, request: FreeRequest): Promise<FreeTime> =>
    FreeTimeSchema.parse(await client.post(`${CALENDARS_ENDPOINT}/free`, request)),
  book: async (client: ZephyrexClient, request: BookRequest): Promise<Booked> =>
    BookedSchema.parse(await client.post(`${CALENDARS_ENDPOINT}/book`, request)),
};
