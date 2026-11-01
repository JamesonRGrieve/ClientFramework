// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { cycleNightLabel, dayOf, isoDay, membersOf, nightAt, nightLabel, RotaSchema, SwapSchema } from './rotaModel';

const rota = {
  id: 'r1',
  name: 'Nights',
  cycle_days: 3,
  starts_on: '2026-09-28',
  owner_id: 'me',
  nights: [{ id: 'n0', day_index: 0, user_id: 'alex', created_at: '2026-09-01T00:00:00', updated_at: null }],
};

describe('the rota model', () => {
  it('reads a rota and a swap as the server sends them', () => {
    expect(RotaSchema.parse(rota).nights[0]?.user_id).toBe('alex');
    expect(() =>
      SwapSchema.parse({ id: 's', night: '2026-10-01', from_user_id: 'a', to_user_id: 'b', status: 'maybe' }),
    ).toThrow();
  });

  it('writes and reads days in local time, as the server does', () => {
    expect(isoDay(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dayOf('2026-01-05').getDate()).toBe(5);
    expect(nightLabel('2026-10-06')).toBe('Tue 6 Oct');
  });

  it('labels each night of the cycle by the day it first falls on', () => {
    expect(cycleNightLabel(rota, 0)).toBe('Night 1 · Mon 28 Sept');
    expect(cycleNightLabel(rota, 2)).toBe('Night 3 · Wed 30 Sept');
  });

  it('finds whom a night of the cycle is with, and who can be given one', () => {
    expect(nightAt(rota, 0)?.user_id).toBe('alex');
    expect(nightAt(rota, 1)).toBeUndefined();
    expect(
      membersOf(rota, [
        { userId: 'sam', name: 'Sam' },
        { userId: 'alex', name: 'Alex' },
      ]),
    ).toEqual(['me', 'alex', 'sam']);
  });
});
