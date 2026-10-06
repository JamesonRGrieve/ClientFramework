// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { emailFilter, NEW_TRIGGER, triggerFields, triggerProblem } from './triggerModel';

describe('triggerModel', () => {
  it('wants a cron expression for a schedule', () => {
    expect(triggerProblem({ ...NEW_TRIGGER, cron: '' })).toMatch(/needs a cron expression/);
    expect(triggerProblem({ ...NEW_TRIGGER, cron: '0 9 * * 1' })).toBeNull();
  });

  it('wants an interval or a due time for a timer, and one that fires once without an interval', () => {
    const timer = { ...NEW_TRIGGER, type: 'timer' as const };
    expect(triggerProblem(timer)).toMatch(/needs an interval, a time it is due, or both/);
    expect(triggerProblem({ ...timer, intervalMinutes: '-1' })).toMatch(/above 0/);
    expect(triggerProblem({ ...timer, dueAt: '2026-10-06T09:00' })).toMatch(/Only once/);
    expect(triggerProblem({ ...timer, dueAt: '2026-10-06T09:00', oneShot: true })).toBeNull();
    expect(triggerProblem({ ...timer, intervalMinutes: '30' })).toBeNull();
  });

  it('makes an email filter only from what is given', () => {
    expect(emailFilter(' @example.com ', '')).toBe('{"from":"@example.com"}');
    expect(emailFilter('', '')).toBeNull();
  });

  it('sends only the fields the trigger’s kind uses, an interval in seconds and a due time in UTC', () => {
    const fields = triggerFields({
      ...NEW_TRIGGER,
      type: 'timer',
      intervalMinutes: '1.5',
      cron: 'ignored',
      instructions: ' Go ',
    });
    expect(fields).toMatchObject({
      invocation_type: 'timer',
      cron: null,
      interval_seconds: 90,
      one_shot: false,
      event_source: null,
      invocation_payload: 'Go',
      due_at: null,
      priority: 3,
    });
    expect(triggerFields({ ...NEW_TRIGGER, type: 'event', source: 'email', emailSubject: 'invoice' }).event_filter).toBe(
      '{"subject":"invoice"}',
    );
  });
});
