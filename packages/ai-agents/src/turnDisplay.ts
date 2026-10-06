// SPDX-License-Identifier: AGPL-3.0-or-later
// How turns, triggers and activities read: what fired them, when they run, and how they ended.
import { shownTime } from 'zephyrex';
import type { Activity, Trigger, Turn } from './triggersApi';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;
const STATE_WARNING = 1;
const STATE_ERROR = 2;

const STATUS_LABELS: Readonly<Record<Turn['status'], string>> = {
  pending: 'Waiting to run',
  running: 'Running',
  succeeded: 'Done',
  failed: 'Failed',
};

const EVENT_LABELS: Readonly<Record<NonNullable<Trigger['event_source']>, string>> = {
  conversation_message: 'a message in a conversation it takes part in',
  webhook: 'a signed call to its webhook',
  email: 'an email',
};

/** An interval in the largest whole unit that fits: "every 2 hours", "every 90 seconds". */
export function intervalLabel(seconds: number): string {
  const [unit, size] =
    seconds % SECONDS_PER_DAY === 0
      ? ['day', SECONDS_PER_DAY]
      : seconds % SECONDS_PER_HOUR === 0
        ? ['hour', SECONDS_PER_HOUR]
        : seconds % SECONDS_PER_MINUTE === 0
          ? ['minute', SECONDS_PER_MINUTE]
          : ['second', 1];
  const count = seconds / size;
  return count === 1 ? `every ${unit}` : `every ${String(count)} ${unit}s`;
}

/** What makes a trigger fire, in words. */
export function triggerSummary(trigger: Trigger): string {
  if (trigger.invocation_type === 'schedule') {
    return `On the schedule ${trigger.cron ?? ''}`;
  }
  if (trigger.invocation_type === 'timer') {
    const first = (trigger.due_at ?? '') === '' ? '' : ` from ${shownTime(trigger.due_at)}`;
    if (trigger.one_shot || trigger.interval_seconds === null || trigger.interval_seconds === undefined) {
      return `Once${first === '' ? ', now' : ` at ${shownTime(trigger.due_at)}`}`;
    }
    const every = intervalLabel(trigger.interval_seconds);
    return `${every.charAt(0).toUpperCase()}${every.slice(1)}${first}`;
  }
  const source =
    trigger.event_source === null || trigger.event_source === undefined ? 'an event' : EVENT_LABELS[trigger.event_source];
  return `On ${source}`;
}

/** How a turn stands or ended, with why it failed. */
export function turnSummary(turn: Turn): string {
  const label = STATUS_LABELS[turn.status];
  if (turn.status === 'failed') {
    return `${label}: ${(turn.error ?? '') === '' ? 'no reason given' : (turn.error ?? '')}`;
  }
  const at = shownTime(turn.completed_at ?? turn.started_at ?? turn.created_at);
  return at === '' ? label : `${label} · ${at}`;
}

/** An activity's state as a word: done, a warning, or an error. */
export const activityState = ({ state }: Pick<Activity, 'state'>): string =>
  state === STATE_ERROR ? 'Error' : state === STATE_WARNING ? 'Warning' : 'Done';
