// SPDX-License-Identifier: AGPL-3.0-or-later
import { type Draft, fromLocalInput, instant, localInput, minutesLabel, numberOf, shown, textOf } from './fields';
import {
  ACTIVITY_KINDS,
  type Activity,
  ActivitySchema,
  MEAL_KINDS,
  type Meal,
  MealSchema,
  type Sleep,
  SleepSchema,
  type Weight,
  WeightSchema,
} from './healthModel';
import type { RecordType } from './records';

const MAX_MINUTES = 1440;
const MAX_NOTES = 2000;
const MAX_HEART_RATE = 260;
const MIN_HEART_RATE = 20;
const MAX_FOOD = 300;
const MAX_UNIT = 30;
const MAX_GRAMS = 2000;
const MAX_KCAL = 20_000;
const MAX_SODIUM_MG = 100_000;
const MAX_WEIGHT_KG = 700;
const MAX_PERCENT = 100;
const MAX_STEPS = 200_000;
const MAX_DISTANCE_KM = 1000;
const DECIMAL = 0.1;
const MIN_WEIGHT_KG = 0.1;
const MS_PER_DAY = 86_400_000;

/** A new record starts now, in the user's time. */
const now = (): string => localInput(new Date().toISOString());

const text = (draft: Draft, key: string): string => draft[key] ?? '';
/** A required number's value; the form refuses a blank before it is read. */
const requiredNumber = (draft: Draft, key: string): number => numberOf(text(draft, key)) ?? 0;
const requiredTime = (draft: Draft, key: string): string => fromLocalInput(text(draft, key));

/** The kind's own spelling, from the choices the field offers. */
function choiceOf<C extends string>(choices: readonly C[], value: string, fallback: C): C {
  return choices.find((choice) => choice === value) ?? fallback;
}

const capitalised = (word: string): string => `${word.charAt(0).toUpperCase()}${word.slice(1)}`;

export const activityType: RecordType<Activity> = {
  name: 'activity',
  title: 'Activity',
  plural: 'Activities',
  endpoint: '/v1/health_activity',
  single: 'health_activity',
  envelope: 'health_activities',
  schema: ActivitySchema,
  fields: [
    { key: 'performed_at', label: 'When', input: 'datetime', required: true },
    { key: 'kind', label: 'Kind', input: 'choice', choices: ACTIVITY_KINDS, required: true },
    { key: 'duration_minutes', label: 'Minutes', input: 'number', min: 1, max: MAX_MINUTES, required: true },
    { key: 'distance_km', label: 'Distance (km)', input: 'number', min: 0, max: MAX_DISTANCE_KM, step: DECIMAL },
    { key: 'steps', label: 'Steps', input: 'number', min: 0, max: MAX_STEPS },
    { key: 'calories_burned', label: 'Calories burned', input: 'number', min: 0, max: MAX_KCAL },
    { key: 'heart_rate_avg', label: 'Average heart rate', input: 'number', min: MIN_HEART_RATE, max: MAX_HEART_RATE },
    { key: 'heart_rate_max', label: 'Peak heart rate', input: 'number', min: MIN_HEART_RATE, max: MAX_HEART_RATE },
    { key: 'notes', label: 'Notes', input: 'text', maxLength: MAX_NOTES, multiline: true },
  ],
  timeOf: ({ performed_at: at }) => at,
  describe: ({ kind, duration_minutes: minutes, distance_km: km }) =>
    `${capitalised(kind)}, ${minutesLabel(minutes)}${km === null || km === undefined ? '' : `, ${String(km)} km`}`,
  draftOf: (row) => ({
    performed_at: row === null ? now() : localInput(row.performed_at),
    kind: row?.kind ?? 'walking',
    duration_minutes: shown(row?.duration_minutes),
    distance_km: shown(row?.distance_km),
    steps: shown(row?.steps),
    calories_burned: shown(row?.calories_burned),
    heart_rate_avg: shown(row?.heart_rate_avg),
    heart_rate_max: shown(row?.heart_rate_max),
    notes: shown(row?.notes),
  }),
  valuesOf: (draft) => ({
    performed_at: requiredTime(draft, 'performed_at'),
    kind: choiceOf(ACTIVITY_KINDS, text(draft, 'kind'), 'other'),
    duration_minutes: requiredNumber(draft, 'duration_minutes'),
    distance_km: numberOf(text(draft, 'distance_km')),
    steps: numberOf(text(draft, 'steps')),
    calories_burned: numberOf(text(draft, 'calories_burned')),
    heart_rate_avg: numberOf(text(draft, 'heart_rate_avg')),
    heart_rate_max: numberOf(text(draft, 'heart_rate_max')),
    notes: textOf(text(draft, 'notes')),
  }),
};

export const mealType: RecordType<Meal> = {
  name: 'meal',
  title: 'Meal',
  plural: 'Meals',
  endpoint: '/v1/health_meal',
  single: 'health_meal',
  envelope: 'health_meals',
  schema: MealSchema,
  fields: [
    { key: 'eaten_at', label: 'When', input: 'datetime', required: true },
    { key: 'kind', label: 'Meal', input: 'choice', choices: MEAL_KINDS, required: true },
    { key: 'food', label: 'Food', input: 'text', maxLength: MAX_FOOD, required: true },
    { key: 'calories', label: 'Calories', input: 'number', min: 0, max: MAX_KCAL, required: true },
    { key: 'serving_size', label: 'Serving size', input: 'number', min: DECIMAL, max: MAX_KCAL, step: DECIMAL },
    { key: 'serving_unit', label: 'Serving unit', input: 'text', maxLength: MAX_UNIT },
    { key: 'protein_g', label: 'Protein (g)', input: 'number', min: 0, max: MAX_GRAMS, step: DECIMAL },
    { key: 'carbs_g', label: 'Carbohydrate (g)', input: 'number', min: 0, max: MAX_GRAMS, step: DECIMAL },
    { key: 'fat_g', label: 'Fat (g)', input: 'number', min: 0, max: MAX_GRAMS, step: DECIMAL },
    { key: 'fiber_g', label: 'Fibre (g)', input: 'number', min: 0, max: MAX_GRAMS, step: DECIMAL },
    { key: 'sugar_g', label: 'Sugar (g)', input: 'number', min: 0, max: MAX_GRAMS, step: DECIMAL },
    { key: 'sodium_mg', label: 'Sodium (mg)', input: 'number', min: 0, max: MAX_SODIUM_MG },
  ],
  timeOf: ({ eaten_at: at }) => at,
  describe: ({ kind, food, calories }) => `${capitalised(kind)}: ${food}, ${String(calories)} kcal`,
  draftOf: (row) => ({
    eaten_at: row === null ? now() : localInput(row.eaten_at),
    kind: row?.kind ?? 'snack',
    food: row?.food ?? '',
    calories: shown(row?.calories),
    serving_size: shown(row?.serving_size),
    serving_unit: shown(row?.serving_unit),
    protein_g: shown(row?.protein_g),
    carbs_g: shown(row?.carbs_g),
    fat_g: shown(row?.fat_g),
    fiber_g: shown(row?.fiber_g),
    sugar_g: shown(row?.sugar_g),
    sodium_mg: shown(row?.sodium_mg),
  }),
  valuesOf: (draft) => ({
    eaten_at: requiredTime(draft, 'eaten_at'),
    kind: choiceOf(MEAL_KINDS, text(draft, 'kind'), 'snack'),
    food: text(draft, 'food').trim(),
    calories: requiredNumber(draft, 'calories'),
    serving_size: numberOf(text(draft, 'serving_size')),
    serving_unit: textOf(text(draft, 'serving_unit')),
    protein_g: numberOf(text(draft, 'protein_g')),
    carbs_g: numberOf(text(draft, 'carbs_g')),
    fat_g: numberOf(text(draft, 'fat_g')),
    fiber_g: numberOf(text(draft, 'fiber_g')),
    sugar_g: numberOf(text(draft, 'sugar_g')),
    sodium_mg: numberOf(text(draft, 'sodium_mg')),
  }),
};

export const weightType: RecordType<Weight> = {
  name: 'weight',
  title: 'Weight',
  plural: 'Weights',
  endpoint: '/v1/health_weight',
  single: 'health_weight',
  envelope: 'health_weights',
  schema: WeightSchema,
  fields: [
    { key: 'measured_at', label: 'When', input: 'datetime', required: true },
    {
      key: 'weight_kg',
      label: 'Weight (kg)',
      input: 'number',
      min: MIN_WEIGHT_KG,
      max: MAX_WEIGHT_KG,
      step: DECIMAL,
      required: true,
    },
    { key: 'body_fat_percent', label: 'Body fat (%)', input: 'number', min: 0, max: MAX_PERCENT, step: DECIMAL },
    { key: 'notes', label: 'Notes', input: 'text', maxLength: MAX_NOTES, multiline: true },
  ],
  timeOf: ({ measured_at: at }) => at,
  describe: ({ weight_kg: kg, body_fat_percent: fat }) =>
    `${String(kg)} kg${fat === null || fat === undefined ? '' : `, ${String(fat)}% body fat`}`,
  draftOf: (row) => ({
    measured_at: row === null ? now() : localInput(row.measured_at),
    weight_kg: shown(row?.weight_kg),
    body_fat_percent: shown(row?.body_fat_percent),
    notes: shown(row?.notes),
  }),
  valuesOf: (draft) => ({
    measured_at: requiredTime(draft, 'measured_at'),
    weight_kg: requiredNumber(draft, 'weight_kg'),
    body_fat_percent: numberOf(text(draft, 'body_fat_percent')),
    notes: textOf(text(draft, 'notes')),
  }),
};

export const sleepType: RecordType<Sleep> = {
  name: 'sleep',
  title: 'Sleep',
  plural: 'Sleep',
  endpoint: '/v1/health_sleep',
  single: 'health_sleep',
  envelope: 'health_sleeps',
  schema: SleepSchema,
  fields: [
    { key: 'bedtime', label: 'Bedtime', input: 'datetime', required: true },
    { key: 'wake_time', label: 'Woke', input: 'datetime', required: true },
    { key: 'deep_minutes', label: 'Deep (min)', input: 'number', min: 0, max: MAX_MINUTES },
    { key: 'light_minutes', label: 'Light (min)', input: 'number', min: 0, max: MAX_MINUTES },
    { key: 'rem_minutes', label: 'REM (min)', input: 'number', min: 0, max: MAX_MINUTES },
    { key: 'awake_minutes', label: 'Awake (min)', input: 'number', min: 0, max: MAX_MINUTES },
    { key: 'quality', label: 'Quality (0–100)', input: 'number', min: 0, max: MAX_PERCENT },
  ],
  timeOf: ({ bedtime }) => bedtime,
  describe: ({ duration_minutes: minutes, quality }) =>
    `${minutesLabel(minutes)}${quality === null || quality === undefined ? '' : `, quality ${String(quality)}`}`,
  draftOf: (row) => ({
    bedtime: row === null ? '' : localInput(row.bedtime),
    wake_time: row === null ? now() : localInput(row.wake_time),
    deep_minutes: shown(row?.deep_minutes),
    light_minutes: shown(row?.light_minutes),
    rem_minutes: shown(row?.rem_minutes),
    awake_minutes: shown(row?.awake_minutes),
    quality: shown(row?.quality),
  }),
  valuesOf: (draft) => ({
    bedtime: requiredTime(draft, 'bedtime'),
    wake_time: requiredTime(draft, 'wake_time'),
    deep_minutes: numberOf(text(draft, 'deep_minutes')),
    light_minutes: numberOf(text(draft, 'light_minutes')),
    rem_minutes: numberOf(text(draft, 'rem_minutes')),
    awake_minutes: numberOf(text(draft, 'awake_minutes')),
    quality: numberOf(text(draft, 'quality')),
  }),
  // The server refuses a night that ends before it starts, or lasts more than a day.
  problemOf: (draft) => {
    const asleep =
      instant(fromLocalInput(text(draft, 'wake_time'))).getTime() -
      instant(fromLocalInput(text(draft, 'bedtime'))).getTime();
    return asleep > 0 && asleep <= MS_PER_DAY ? null : 'Waking must come after bedtime, within a day.';
  },
};

/** Every kind of record in the health log, in the order the pages show them. */
export const RECORD_TYPES = [activityType, mealType, weightType, sleepType] as const;
