// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { localInput } from './fields';
import { healthFixture } from './health.mocks';
import type { Weight } from './healthModel';
import { changesFrom, conflictFields, newestFirst } from './records';
import { activityType, weightType } from './recordTypes';

const firstWeight = ((): Weight => {
  const weight = healthFixture().weights.at(0);
  if (weight === undefined) {
    throw new Error('The fixture has no weights');
  }
  return weight;
})();

describe('health records', () => {
  it('sends every value for a new record, and only what changed for an existing one', () => {
    const draft = weightType.draftOf(firstWeight);
    expect(changesFrom(weightType, firstWeight, draft)).toEqual({});
    expect(changesFrom(weightType, firstWeight, { ...draft, weight_kg: '69.9', notes: 'after the run' })).toEqual({
      weight_kg: 69.9,
      notes: 'after the run',
    });
    expect(changesFrom(weightType, null, draft)).toMatchObject({ weight_kg: 70.4, body_fat_percent: null });
  });

  it('counts a timestamp as changed only when it names another instant', () => {
    const draft = weightType.draftOf(firstWeight);
    expect(changesFrom(weightType, { ...firstWeight, measured_at: '2026-09-28T07:30:00' }, draft)).toEqual({});
    const later = localInput('2026-09-28T08:30:00Z');
    expect(changesFrom(weightType, firstWeight, { ...draft, measured_at: later })).toEqual({
      measured_at: '2026-09-28T08:30:00.000Z',
    });
  });

  it('compares a conflict field by field, timestamps in the user’s time', () => {
    const fields = conflictFields(weightType);
    expect(fields.map(({ key }) => key)).toEqual(['measured_at', 'weight_kg', 'body_fat_percent', 'notes']);
    const measured = fields.at(0);
    expect(measured?.format?.({ measured_at: '2026-09-28T07:30:00Z' })).toBe(
      new Date('2026-09-28T07:30:00Z').toLocaleString(),
    );
    expect(measured?.format?.({})).toBe('');
  });

  it('orders records newest first', () => {
    const { activities } = healthFixture();
    expect([...activities].sort(newestFirst(activityType)).map(({ id }) => id)).toEqual(['a2', 'a1']);
  });
});
