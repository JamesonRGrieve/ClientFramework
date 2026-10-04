// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { FIXTURE_VERSION, healthFixture } from './health.mocks';
import type { Meal } from './healthModel';
import { caloriesOn, lastNight, latestWeight, weeklyActiveMinutes } from './summary';

const fixture = healthFixture();
/** Noon on Wednesday 30 September 2026 in the user's time: inside the fixture's week however the zone falls. */
const WEDNESDAY = new Date(2026, 8, 30, 12);

/** A meal eaten at `hour` on `day` of September or October 2026, in the user's own time. */
const meal = (id: string, month: number, day: number, hour: number, calories: number): Meal => ({
  id,
  eaten_at: new Date(2026, month, day, hour).toISOString(),
  kind: 'snack',
  food: 'Toast',
  calories,
  created_at: FIXTURE_VERSION,
});

describe('the health summary', () => {
  it('finds the latest weighing and the last night', () => {
    expect(latestWeight(fixture.weights)?.id).toBe('w2');
    expect(lastNight(fixture.sleeps)?.id).toBe('s1');
    expect(latestWeight([])).toBeUndefined();
  });

  it('adds up the week’s active minutes', () => {
    expect(weeklyActiveMinutes(fixture.activities, WEDNESDAY)).toBe(75);
    expect(weeklyActiveMinutes(fixture.activities, new Date(2026, 9, 20, 12))).toBe(0);
  });

  it('adds up the calories eaten on a day of the user’s own calendar', () => {
    const meals = [meal('m1', 8, 30, 8, 350), meal('m2', 8, 30, 23, 600), meal('m3', 9, 1, 0, 200)];
    expect(caloriesOn(meals, WEDNESDAY)).toBe(950);
    expect(caloriesOn(meals, new Date(2026, 9, 1, 12))).toBe(200);
    expect(caloriesOn(meals, new Date(2026, 8, 25, 12))).toBe(0);
  });
});
