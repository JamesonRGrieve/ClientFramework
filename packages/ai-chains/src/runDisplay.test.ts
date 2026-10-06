// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { shownTime } from 'zephyrex';
import { rowOf } from 'zephyrex/testing/msw';
import { chainsFixture, RUN_ID } from './chains.mocks';
import { isStoppable, resultSummary, runSummary, stepArguments, stepSummary } from './runDisplay';

const names = { prompt: (id: string): string => `prompt ${id}`, ability: (id: string): string => `ability ${id}` };

describe('runDisplay', () => {
  const { runs, steps, results } = chainsFixture();

  it('says how a run ended: when and in how many steps, or why it stopped', () => {
    expect(runSummary(rowOf(runs, RUN_ID))).toBe(`Done · 4 steps · ${shownTime('2026-10-01T09:00:05')}`);
    expect(runSummary(rowOf(runs, 'run-2'))).toBe('Failed after 3 steps (a step failed: No model answered)');
    expect(
      runSummary({ ...rowOf(runs, 'run-2'), status: 'cancelled', error_kind: null, error: null, steps_executed: 1 }),
    ).toBe('Stopped after 1 step');
    expect(runSummary(rowOf(runs, 'run-3'))).toBe(`Running · ${shownTime('2026-10-03T09:00:00')}`);
  });

  it('may stop a run only while it waits or runs', () => {
    expect(runs.map(isStoppable)).toEqual([false, false, true]);
  });

  it('says what each kind of step does', () => {
    expect(steps.map((step) => stepSummary(step, names))).toEqual([
      'Use ability ab-search into found',
      'If len(found) > 0, go to the next step; otherwise the end',
      'Ask prompt brief into summary',
      'Set finished to true',
    ]);
    expect(stepArguments(rowOf(steps, 's-search'))).toBe('query = topic');
    expect(stepArguments(rowOf(steps, 's-done'))).toBe('');
  });

  it('says where an executed step came in the run, and how long it took', () => {
    expect(results.map(resultSummary)).toEqual([
      '1. search (ability) · succeeded in 1.2s',
      '2. check (condition) · succeeded in 0.0s',
      '3. summarise (prompt) · succeeded in 2.5s',
    ]);
    expect(resultSummary({ ...rowOf(results, 'result-1'), duration_ms: null })).toBe('1. search (ability) · succeeded');
  });
});
