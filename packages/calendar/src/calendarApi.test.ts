// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { testConfig } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { calendarApi } from './calendarApi';
import { ALEX, calendarFixture, calendarHandlers, JO, ME } from './calendar.mocks';

describe('calendarApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('finds free time and books it where it may go', async () => {
    const store = calendarFixture();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(calendarHandlers(store))));
    const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });
    const found = await calendarApi.findFree(client, {
      user_ids: [ALEX, JO],
      first_day: '2026-11-06',
      days: 2,
      duration_minutes: 120,
      day_start: '18:00',
      day_end: '23:00',
      timezone: 'UTC',
    });
    expect(found.slots).toHaveLength(2);
    const slot = found.slots[0] ?? { start: '', end: '' };
    const booked = await calendarApi.book(client, {
      title: 'Dinner',
      start: slot.start,
      end: slot.end,
      user_ids: [ALEX, JO],
    });
    expect(booked).toEqual({ booked: [ME, ALEX], not_booked: [JO], failed: [] });
  });
});
