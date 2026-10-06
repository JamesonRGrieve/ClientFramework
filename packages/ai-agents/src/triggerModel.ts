// SPDX-License-Identifier: AGPL-3.0-or-later
// A new trigger's form, checked as the server checks it before anything is sent, and turned into the
// fields the server takes.
import { DEFAULT_PRIORITY, type TriggerFields, type TriggerSource, type TriggerType } from './triggersApi';

const SECONDS_PER_MINUTE = 60;
/** A cron expression's fields: minute, hour, day of month, month, day of week. */
const CRON_FIELDS = 5;

/** A new trigger's form, as typed. */
export interface TriggerDraft {
  type: TriggerType;
  cron: string;
  /** A timer's interval, in minutes; blank for none. */
  intervalMinutes: string;
  oneShot: boolean;
  source: TriggerSource;
  /** An email trigger's match: the sender (an address or @domain) and a phrase in the subject. */
  emailFrom: string;
  emailSubject: string;
  /** When it is first due (a datetime-local input's text, in the user's time); blank for none. */
  dueAt: string;
  instructions: string;
  priority: number;
}

export const NEW_TRIGGER: TriggerDraft = {
  type: 'schedule',
  cron: '',
  intervalMinutes: '',
  oneShot: false,
  source: 'conversation_message',
  emailFrom: '',
  emailSubject: '',
  dueAt: '',
  instructions: '',
  priority: DEFAULT_PRIORITY,
};

/** Why the server would refuse `draft`, or null. */
export function triggerProblem(draft: TriggerDraft): string | null {
  if (draft.type === 'schedule') {
    return draft.cron.trim().split(/\s+/).length >= CRON_FIELDS
      ? null
      : 'A schedule needs a cron expression, such as 0 9 * * 1.';
  }
  if (draft.type === 'timer') {
    const minutes = draft.intervalMinutes.trim();
    if (minutes !== '' && (Number.isNaN(Number(minutes)) || Number(minutes) <= 0)) {
      return 'The interval is a number of minutes above 0.';
    }
    if (minutes === '' && draft.dueAt === '') {
      return 'A timer needs an interval, a time it is due, or both.';
    }
    if (minutes === '' && !draft.oneShot) {
      return 'A timer without an interval fires once: tick “Only once”.';
    }
  }
  return null;
}

/** An email trigger's filter: the JSON object the server matches mail against; none to match all. */
export function emailFilter(from: string, subject: string): string | null {
  const given: [string, string][] = [
    ['from', from.trim()],
    ['subject', subject.trim()],
  ];
  const filter: Record<string, string> = Object.fromEntries(given.filter(([, value]) => value !== ''));
  return Object.keys(filter).length === 0 ? null : JSON.stringify(filter);
}

/** The fields the server takes for `draft`. */
export function triggerFields(draft: TriggerDraft): TriggerFields {
  const isTimer = draft.type === 'timer';
  const minutes = draft.intervalMinutes.trim();
  return {
    invocation_type: draft.type,
    enabled: true,
    cron: draft.type === 'schedule' ? draft.cron.trim() : null,
    interval_seconds: isTimer && minutes !== '' ? Math.round(Number(minutes) * SECONDS_PER_MINUTE) : null,
    one_shot: isTimer && draft.oneShot,
    event_source: draft.type === 'event' ? draft.source : null,
    event_filter:
      draft.type === 'event' && draft.source === 'email' ? emailFilter(draft.emailFrom, draft.emailSubject) : null,
    invocation_payload: draft.instructions.trim() === '' ? null : draft.instructions.trim(),
    due_at: draft.dueAt === '' ? null : new Date(draft.dueAt).toISOString(),
    priority: draft.priority,
  };
}
