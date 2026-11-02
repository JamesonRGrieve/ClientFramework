// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory /v1/calendars for the package's tests and stories (never compiled into dist): the
// user's calendars, whom they share with and who shares with them, and the server's rules for
// free time (one evening slot each day) and booking (into the user's and those who allow it).
import { http, HttpResponse, type RequestHandler } from 'msw';
import { z } from 'zod';
import type { AvailabilityShare, CalendarAccount } from './calendarModel';

const HTTP_FORBIDDEN = 403;
const HTTP_UNPROCESSABLE = 422;
const HTTP_CONFLICT = 409;
const MS_PER_MINUTE = 60_000;

export const ME = 'u-me';
export const ALEX = 'u-alex';
export const SAM = 'u-sam';
export const JO = 'u-jo';

/** What the mock server holds. */
export interface CalendarStore {
  accounts: CalendarAccount[];
  shares: AvailabilityShare[];
  sharedWithMe: AvailabilityShare[];
  /** Whose calendars have no account connected. */
  unconnected: string[];
  asked: { user_ids: string[]; duration_minutes: number }[];
  booked: { title: string; user_ids: string[] }[];
}

/** One CalDAV calendar; you share with Alex (who may book); Alex lets you book, Jo only shares. */
export function calendarFixture(): CalendarStore {
  return {
    accounts: [
      { id: 'a1', provider: 'caldav', label: 'Personal', calendar_url: 'https://dav.example.org/cal/', username: 'me' },
    ],
    shares: [{ user_id: ALEX, can_book: true }],
    sharedWithMe: [
      { user_id: ALEX, can_book: true },
      { user_id: JO, can_book: false },
    ],
    unconnected: [],
    asked: [],
    booked: [],
  };
}

export function emptyCalendarStore(): CalendarStore {
  return { accounts: [], shares: [], sharedWithMe: [], unconnected: [], asked: [], booked: [] };
}

const refuse = (status: number, detail: string): Response => HttpResponse.json({ detail }, { status });

const Connect = z.object({
  provider: z.string(),
  label: z.string(),
  calendar_url: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});
const Free = z.object({
  user_ids: z.array(z.string()),
  first_day: z.string(),
  days: z.number(),
  duration_minutes: z.number(),
});
const Book = z.object({ title: z.string(), user_ids: z.array(z.string()) });

export function calendarHandlers(store: CalendarStore = calendarFixture()): RequestHandler[] {
  let made = 0;
  const sharing = (userId: string): AvailabilityShare | undefined =>
    store.sharedWithMe.find((share) => share.user_id === userId);
  return [
    http.get('*/v1/user', () => HttpResponse.json({ user: { id: ME, email: 'me@example.com' } })),
    http.get('*/v1/calendars/accounts', () => HttpResponse.json({ accounts: store.accounts })),
    http.post('*/v1/calendars/accounts', async ({ request }) => {
      const body = Connect.parse(await request.json());
      if (body.provider !== 'caldav') {
        return refuse(HTTP_CONFLICT, `Sign in with ${body.provider.split('_')[0] ?? ''} to reach your calendar`);
      }
      if (body.password === 'wrong') {
        return refuse(HTTP_UNPROCESSABLE, 'The calendar refused the sign-in');
      }
      const account = {
        id: `account-${String(++made)}`,
        provider: body.provider,
        label: body.label,
        calendar_url: body.calendar_url,
        username: body.username,
      };
      store.accounts.push(account);
      return HttpResponse.json(account);
    }),
    http.post('*/v1/calendars/accounts/:id/remove', ({ params: { id } }) => {
      store.accounts = store.accounts.filter((account) => account.id !== id);
      return HttpResponse.json({ accounts: store.accounts });
    }),
    http.get('*/v1/calendars/shares', () => HttpResponse.json({ shares: store.shares })),
    http.post('*/v1/calendars/shares', async ({ request }) => {
      const { viewer_user_id: userId, can_book: canBook } = z
        .object({ viewer_user_id: z.string(), can_book: z.boolean() })
        .parse(await request.json());
      store.shares = [...store.shares.filter((share) => share.user_id !== userId), { user_id: userId, can_book: canBook }];
      return HttpResponse.json({ shares: store.shares });
    }),
    http.post('*/v1/calendars/shares/:userId/remove', ({ params: { userId } }) => {
      store.shares = store.shares.filter((share) => share.user_id !== userId);
      return HttpResponse.json({ shares: store.shares });
    }),
    http.get('*/v1/calendars/shared-with-me', () => HttpResponse.json({ shares: store.sharedWithMe })),
    http.post('*/v1/calendars/free', async ({ request }) => {
      const body = Free.parse(await request.json());
      if (body.user_ids.some((userId) => sharing(userId) === undefined)) {
        return refuse(HTTP_FORBIDDEN, 'Some of them do not share their availability with you');
      }
      store.asked.push({ user_ids: body.user_ids, duration_minutes: body.duration_minutes });
      const slots = Array.from({ length: body.days }, (_, offset) => {
        const day = new Date(`${body.first_day}T19:00:00Z`);
        day.setUTCDate(day.getUTCDate() + offset);
        return {
          start: day.toISOString(),
          end: new Date(day.getTime() + body.duration_minutes * MS_PER_MINUTE).toISOString(),
        };
      });
      const people = [ME, ...body.user_ids].map((userId) => ({
        user_id: userId,
        calendars: store.unconnected.includes(userId) ? 0 : 1,
        unreadable: 0,
      }));
      return HttpResponse.json({ slots, people });
    }),
    http.post('*/v1/calendars/book', async ({ request }) => {
      const body = Book.parse(await request.json());
      store.booked.push(body);
      const allowed = (userId: string): boolean => sharing(userId)?.can_book === true && !store.unconnected.includes(userId);
      return HttpResponse.json({
        booked: [ME, ...body.user_ids.filter(allowed)],
        not_booked: body.user_ids.filter((userId) => !allowed(userId)),
        failed: [],
      });
    }),
  ];
}
