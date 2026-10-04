// SPDX-License-Identifier: AGPL-3.0-or-later
// The overview's figures, worked out from the logs themselves (the server has no summary route).
import { serverInstant } from 'zephyrex';
import type { Activity, Meal, Sleep, Weight } from './healthModel';

const DAYS_PER_WEEK = 7;

const newest = <T>(rows: readonly T[], timeOf: (row: T) => string): T | undefined =>
  [...rows].sort((a, b) => serverInstant(timeOf(b)).getTime() - serverInstant(timeOf(a)).getTime()).at(0);

/** The most recent weighing. */
export const latestWeight = (weights: readonly Weight[]): Weight | undefined => newest(weights, ({ measured_at: at }) => at);

/** The most recent night. */
export const lastNight = (nights: readonly Sleep[]): Sleep | undefined => newest(nights, ({ bedtime }) => bedtime);

/** The start of `day` in the user's own time. */
const startOfDay = (day: Date): Date => new Date(day.getFullYear(), day.getMonth(), day.getDate());

/** Minutes of activity over the seven days up to and including `today`. */
export function weeklyActiveMinutes(activities: readonly Activity[], today: Date): number {
  const since = startOfDay(today);
  since.setDate(since.getDate() - (DAYS_PER_WEEK - 1));
  return activities
    .filter(({ performed_at: at }) => serverInstant(at) >= since)
    .reduce((total, { duration_minutes: minutes }) => total + minutes, 0);
}

/** Calories eaten on `day`, in the user's own time. */
export function caloriesOn(meals: readonly Meal[], day: Date): number {
  const start = startOfDay(day);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return meals
    .filter(({ eaten_at: at }) => serverInstant(at) >= start && serverInstant(at) < end)
    .reduce((total, { calories }) => total + calories, 0);
}
