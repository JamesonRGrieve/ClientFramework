// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { shownTime } from 'zephyrex';
import { rowOf } from 'zephyrex/testing/msw';
import { agentsFixture, TURN_ID } from './agents.mocks';
import { activityState, intervalLabel, triggerSummary, turnSummary } from './turnDisplay';

describe('turnDisplay', () => {
  const store = agentsFixture();

  it('says an interval in the largest whole unit', () => {
    expect([30, 60, 120, 3600, 86_400, 90].map(intervalLabel)).toEqual([
      'every 30 seconds',
      'every minute',
      'every 2 minutes',
      'every hour',
      'every day',
      'every 90 seconds',
    ]);
  });

  it('says what fires a trigger', () => {
    expect(triggerSummary(rowOf(store.triggers, 'every-monday'))).toBe('On the schedule 0 9 * * 1');
    expect(triggerSummary(rowOf(store.triggers, 'hook'))).toBe('On a signed call to its webhook');
    const timer = { ...rowOf(store.triggers, 'every-monday'), invocation_type: 'timer' as const, cron: null };
    expect(triggerSummary({ ...timer, interval_seconds: 3600 })).toBe('Every hour');
    expect(triggerSummary({ ...timer, one_shot: true })).toBe('Once, now');
  });

  it('says how a turn ended, and why one failed', () => {
    expect(turnSummary(rowOf(store.turns, TURN_ID))).toBe(`Done · ${shownTime('2026-10-01T09:00:09')}`);
    expect(turnSummary(rowOf(store.turns, 'turn-2'))).toBe('Failed: No model answered');
  });

  it('names an activity’s state', () => {
    expect([0, 1, 2, null].map((state) => activityState({ state }))).toEqual(['Done', 'Warning', 'Error', 'Done']);
  });
});
