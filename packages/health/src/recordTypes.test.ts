// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { localInput } from './fields';
import { healthFixture } from './health.mocks';
import type { Activity } from './healthModel';
import { activityType, mealType, RECORD_TYPES, sleepType, weightType } from './recordTypes';

const fixture = healthFixture();

const firstRun = ((): Activity => {
  const run = fixture.activities.at(0);
  if (run === undefined) {
    throw new Error('The fixture has no activities');
  }
  return run;
})();

describe('the health record types', () => {
  it('names each log after the server’s route and envelopes', () => {
    expect(RECORD_TYPES.map(({ name, endpoint, single, envelope }) => [name, endpoint, single, envelope])).toEqual([
      ['activity', '/v1/health_activity', 'health_activity', 'health_activities'],
      ['meal', '/v1/health_meal', 'health_meal', 'health_meals'],
      ['weight', '/v1/health_weight', 'health_weight', 'health_weights'],
      ['sleep', '/v1/health_sleep', 'health_sleep', 'health_sleeps'],
    ]);
  });

  it('describes a record in a few words', () => {
    expect(fixture.activities.map(activityType.describe)).toEqual(['Running, 30 min, 5 km', 'Yoga, 45 min']);
    expect(fixture.meals.map(mealType.describe)).toEqual([
      'Breakfast: Porridge, 350 kcal',
      'Lunch: Soup and bread, 600 kcal',
    ]);
    expect(fixture.weights.map(weightType.describe)).toEqual(['70.4 kg', '70.1 kg, 21.5% body fat']);
    expect(fixture.sleeps.map(sleepType.describe)).toEqual(['7 h 30 min, quality 80']);
  });

  it('gives every field a place in its form', () => {
    expect(activityType.fields.map(({ key }) => key).sort()).toEqual(Object.keys(activityType.draftOf(null)).sort());
    expect(mealType.fields.map(({ key }) => key).sort()).toEqual(Object.keys(mealType.draftOf(null)).sort());
    expect(weightType.fields.map(({ key }) => key).sort()).toEqual(Object.keys(weightType.draftOf(null)).sort());
    expect(sleepType.fields.map(({ key }) => key).sort()).toEqual(Object.keys(sleepType.draftOf(null)).sort());
  });

  it('turns a record into its form’s text and back into its values', () => {
    expect(activityType.valuesOf(activityType.draftOf(firstRun))).toEqual({
      performed_at: '2026-09-28T07:00:00.000Z',
      kind: 'running',
      duration_minutes: 30,
      distance_km: 5,
      steps: null,
      calories_burned: null,
      heart_rate_avg: null,
      heart_rate_max: null,
      notes: null,
    });
  });

  it('starts a new record now, with its kind’s default', () => {
    const draft = mealType.draftOf(null);
    expect(draft['kind']).toBe('snack');
    expect(draft['eaten_at']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('refuses a night that ends before it starts, or lasts more than a day', () => {
    const night = (bed: string, wake: string): string | null =>
      sleepType.problemOf?.({ bedtime: localInput(bed), wake_time: localInput(wake) }) ?? null;
    const refused = 'Waking must come after bedtime, within a day.';
    const woke = '2026-09-30T06:30:00Z';
    expect(night('2026-09-29T23:00:00Z', woke)).toBeNull();
    expect(night(woke, '2026-09-29T23:00:00Z')).toBe(refused);
    expect(night('2026-09-28T23:00:00Z', woke)).toBe(refused);
  });
});
