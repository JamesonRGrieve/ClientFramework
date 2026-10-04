// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's health extension (zephyrex[health]): the user's log of
// activities, meals, weights and nights of sleep. Every change to a record is guarded by its version.
export { healthExtension } from './extension';
export { HealthPage } from './HealthPage';
export { RecordsPage } from './RecordsPage';
export { HEALTH_PATH, recordsPath } from './routes';
export { createRecord, useRecordActions, useRecords } from './healthApi';
export type { RecordActions } from './healthApi';
export { ACTIVITY_KINDS, ActivitySchema, MEAL_KINDS, MealSchema, SleepSchema, WeightSchema } from './healthModel';
export type { Activity, Meal, Sleep, Weight } from './healthModel';
export { activityType, mealType, RECORD_TYPES, sleepType, weightType } from './recordTypes';
export type { HealthRow, RecordType } from './records';
