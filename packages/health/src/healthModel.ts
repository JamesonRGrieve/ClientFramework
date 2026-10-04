// SPDX-License-Identifier: AGPL-3.0-or-later
import { z } from 'zod';

const optionalNumber = z.number().nullable().optional();
const optionalInteger = z.number().int().nullable().optional();
const optionalText = z.string().nullable().optional();

/** The row's version, sent back verbatim as If-Match on every change. */
const version = { created_at: optionalText, updated_at: optionalText };

export const ACTIVITY_KINDS = ['running', 'walking', 'cycling', 'swimming', 'strength', 'yoga', 'hiking', 'other'] as const;
export const MEAL_KINDS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const ActivitySchema = z.object({
  id: z.string(),
  performed_at: z.string(),
  kind: z.enum(ACTIVITY_KINDS),
  duration_minutes: z.number().int(),
  calories_burned: optionalNumber,
  steps: optionalInteger,
  distance_km: optionalNumber,
  heart_rate_avg: optionalInteger,
  heart_rate_max: optionalInteger,
  notes: optionalText,
  ...version,
});
export type Activity = z.infer<typeof ActivitySchema>;

export const MealSchema = z.object({
  id: z.string(),
  eaten_at: z.string(),
  kind: z.enum(MEAL_KINDS),
  food: z.string(),
  serving_size: optionalNumber,
  serving_unit: optionalText,
  calories: z.number(),
  protein_g: optionalNumber,
  carbs_g: optionalNumber,
  fat_g: optionalNumber,
  fiber_g: optionalNumber,
  sugar_g: optionalNumber,
  sodium_mg: optionalNumber,
  ...version,
});
export type Meal = z.infer<typeof MealSchema>;

export const WeightSchema = z.object({
  id: z.string(),
  measured_at: z.string(),
  weight_kg: z.number(),
  body_fat_percent: optionalNumber,
  notes: optionalText,
  ...version,
});
export type Weight = z.infer<typeof WeightSchema>;

export const SleepSchema = z.object({
  id: z.string(),
  bedtime: z.string(),
  wake_time: z.string(),
  /** Bed to wake, counted by the server; never sent. */
  duration_minutes: z.number().int(),
  deep_minutes: optionalInteger,
  light_minutes: optionalInteger,
  rem_minutes: optionalInteger,
  awake_minutes: optionalInteger,
  /** 0–100. */
  quality: optionalInteger,
  ...version,
});
export type Sleep = z.infer<typeof SleepSchema>;
