// SPDX-License-Identifier: AGPL-3.0-or-later
// What the server's calendar extension answers on /v1/calendars: the user's own calendar accounts,
// whom they share their availability with, the free times found, and where a booking went.
import { z } from 'zod';

/** The calendar services a user connects, as the server knows them. */
export const CALENDAR_SERVICES = [
  { provider: 'caldav', label: 'CalDAV (iCloud, Fastmail, Nextcloud…)' },
  { provider: 'google_calendar', label: 'Google Calendar' },
  { provider: 'microsoft_calendar', label: 'Microsoft 365 / Outlook' },
] as const;
export type CalendarService = (typeof CALENDAR_SERVICES)[number]['provider'];

export const AccountSchema = z.object({
  id: z.string(),
  provider: z.string(),
  label: z.string(),
  calendar_url: z.string().nullish(),
  username: z.string().nullish(),
  calendar_id: z.string().nullish(),
});
export type CalendarAccount = z.infer<typeof AccountSchema>;

export const ShareSchema = z.object({ user_id: z.string(), can_book: z.boolean() });
export type AvailabilityShare = z.infer<typeof ShareSchema>;

export const FreeTimeSchema = z.object({
  slots: z.array(z.object({ start: z.string(), end: z.string() })),
  people: z.array(z.object({ user_id: z.string(), calendars: z.number(), unreadable: z.number() })),
});
export type FreeTime = z.infer<typeof FreeTimeSchema>;
export type FreeSlot = FreeTime['slots'][number];

export const BookedSchema = z.object({
  booked: z.array(z.string()),
  not_booked: z.array(z.string()),
  failed: z.array(z.string()),
});
export type Booked = z.infer<typeof BookedSchema>;

/** Someone the app knows: their account and what to call them. */
export interface CalendarPerson {
  userId: string;
  name: string;
}

export function serviceLabel(provider: string): string {
  return CALENDAR_SERVICES.find((service) => service.provider === provider)?.label ?? provider;
}

/** A slot for people, in their own time zone, e.g. "Fri 6 Nov, 19:00–21:00". */
export function slotLabel(slot: FreeSlot, timeZone?: string): string {
  const options: Intl.DateTimeFormatOptions = { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  const day = new Date(slot.start).toLocaleDateString('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const from = new Date(slot.start).toLocaleTimeString('en-GB', options);
  const to = new Date(slot.end).toLocaleTimeString('en-GB', options);
  return `${day}, ${from}–${to}`;
}

/** The browser's time zone, for the server to read the day's window in. */
export function browserZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
