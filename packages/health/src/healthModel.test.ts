// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { healthFixture } from './health.mocks';
import { ActivitySchema, MealSchema, SleepSchema, WeightSchema } from './healthModel';

describe('the health records’ shapes', () => {
  const fixture = healthFixture();

  it('reads each kind of record as the server sends it', () => {
    expect(fixture.activities.map((row) => ActivitySchema.parse(row))).toEqual(fixture.activities);
    expect(fixture.meals.map((row) => MealSchema.parse(row))).toEqual(fixture.meals);
    expect(fixture.weights.map((row) => WeightSchema.parse(row))).toEqual(fixture.weights);
    expect(fixture.sleeps.map((row) => SleepSchema.parse(row))).toEqual(fixture.sleeps);
  });

  it('refuses a kind the server does not have, and a fractional count', () => {
    const [run] = fixture.activities;
    expect(ActivitySchema.safeParse({ ...run, kind: 'skydiving' }).success).toBe(false);
    expect(ActivitySchema.safeParse({ ...run, duration_minutes: 30.5 }).success).toBe(false);
    expect(MealSchema.safeParse({ ...fixture.meals.at(0), kind: 'brunch' }).success).toBe(false);
  });
});
