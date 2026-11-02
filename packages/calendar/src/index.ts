// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's calendar extension (zephyrex[calendar]): a user's own calendars,
// sharing when they are busy, and finding and booking a time together.
export { AvailabilityPage } from './AvailabilityPage';
export type { AvailabilityPageProps } from './AvailabilityPage';
export { CALENDARS_ENDPOINT, calendarApi, useAvailabilityShares, useCalendarAccounts, useSharedWithMe } from './calendarApi';
export type { BookRequest, FreeRequest, NewAccount } from './calendarApi';
export { AccountSchema, BookedSchema, CALENDAR_SERVICES, FreeTimeSchema, slotLabel } from './calendarModel';
export type {
  AvailabilityShare,
  Booked,
  CalendarAccount,
  CalendarPerson,
  CalendarService,
  FreeSlot,
  FreeTime,
} from './calendarModel';
export { calendarExtension } from './extension';
export { AVAILABILITY_PATH } from './routes';
