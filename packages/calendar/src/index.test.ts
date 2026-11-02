// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/calendar', () => {
  it('publishes the page, its reads and writes, the model, and the extension that mounts it', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'AVAILABILITY_PATH',
        'AccountSchema',
        'AvailabilityPage',
        'BookedSchema',
        'CALENDARS_ENDPOINT',
        'CALENDAR_SERVICES',
        'FreeTimeSchema',
        'calendarApi',
        'calendarExtension',
        'slotLabel',
        'useAvailabilityShares',
        'useCalendarAccounts',
        'useSharedWithMe',
      ].sort(),
    );
  });
});
