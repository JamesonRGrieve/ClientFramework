// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { BookedSchema, browserZone, serviceLabel, slotLabel } from './calendarModel';

describe('the calendar model', () => {
  it('names each calendar service', () => {
    expect(serviceLabel('google_calendar')).toBe('Google Calendar');
    expect(serviceLabel('somewhere_else')).toBe('somewhere_else');
  });

  it('labels a slot in the zone asked for', () => {
    expect(slotLabel({ start: '2026-11-06T19:00:00Z', end: '2026-11-06T21:00:00Z' }, 'UTC')).toBe('Fri 6 Nov, 19:00–21:00');
    expect(slotLabel({ start: '2026-11-06T19:00:00Z', end: '2026-11-06T21:00:00Z' }, 'America/Edmonton')).toBe(
      'Fri 6 Nov, 12:00–14:00',
    );
  });

  it('knows the browser’s zone', () => {
    expect(browserZone()).not.toBe('');
  });

  it('reads where a booking went', () => {
    expect(BookedSchema.parse({ booked: ['a'], not_booked: [], failed: [] }).booked).toEqual(['a']);
  });
});
