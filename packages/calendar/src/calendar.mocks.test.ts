// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { ALEX, calendarFixture, emptyCalendarStore, JO } from './calendar.mocks';

describe('the calendar mock', () => {
  it('has Alex letting you book and Jo only sharing', () => {
    expect(calendarFixture().sharedWithMe).toEqual([
      { user_id: ALEX, can_book: true },
      { user_id: JO, can_book: false },
    ]);
  });

  it('starts empty when asked', () => {
    expect(emptyCalendarStore().accounts).toEqual([]);
  });
});
