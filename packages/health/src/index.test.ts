// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/health', () => {
  it('publishes the health pages, the logs’ reads and writes, and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'ACTIVITY_KINDS',
        'ActivitySchema',
        'HEALTH_PATH',
        'HealthPage',
        'MEAL_KINDS',
        'MealSchema',
        'RECORD_TYPES',
        'RecordsPage',
        'SleepSchema',
        'WeightSchema',
        'activityType',
        'createRecord',
        'healthExtension',
        'mealType',
        'recordsPath',
        'sleepType',
        'useRecordActions',
        'useRecords',
        'weightType',
      ].sort(),
    );
  });
});
