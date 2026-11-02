# @zephyrex/calendar

Shared availability in a Zephyrex app: connect your own calendars (any CalDAV calendar, or Google
or Microsoft through the account you linked), share when you are busy (never what) with the people
you choose, find the times you are all free, and book a date into everyone's calendars who lets you.
It is the client half of the Zephyrex server's `calendar` extension (`/v1/calendars`).

## Install

```bash
pnpm add @zephyrex/calendar
```

Peer dependencies: `zephyrex`, `next`, `react`, `swr` and `zod`.

## Use

```typescript
import { calendarExtension } from '@zephyrex/calendar';

const config: ZephyrexConfig = { extensions: [calendarExtension] };
```

It adds a **Shared availability** menu entry and the page `/availability`. `AvailabilityPage` takes
`people` (`{ userId, name }[]`), the accounts the app knows, to share with and find time with, and
`accountPage`, where the user links Google or Microsoft (`/user/manage` by default). `wrapFind` wraps
finding and booking a time, for an app that only lets some plans do it.

## Exports

- Extension and page: `calendarExtension`, `AvailabilityPage`, `AVAILABILITY_PATH`.
- Reads and writes: `useCalendarAccounts`, `useAvailabilityShares`, `useSharedWithMe`, `calendarApi`,
  and the endpoint `CALENDARS_ENDPOINT`.
- Model: `CALENDAR_SERVICES`, `AccountSchema`, `FreeTimeSchema`, `BookedSchema`, `slotLabel`.

## License

AGPL-3.0-or-later.
