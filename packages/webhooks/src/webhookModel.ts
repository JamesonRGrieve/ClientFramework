// SPDX-License-Identifier: AGPL-3.0-or-later
// A subscription's fields as the server checks them, checked here first so the form says what's
// wrong before anything is sent; and a secret to sign deliveries with.

/** The server's shortest accepted signing secret. */
export const MIN_SECRET_LENGTH = 16;
/** The most event types one subscription names. */
const MAX_EVENT_TYPES = 50;
/** Every event type. */
export const ALL_EVENTS = '*';
const EVENT_TYPE = /^(\*|[A-Za-z\d][\w.:-]{0,99})$/;
const TARGET_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:']);
/** Bytes of randomness in a generated secret (twice as many hex characters). */
const SECRET_BYTES = 32;
const HEX = 16;

/** Why `url` can't be a target (an absolute http(s) URL with a host and no credentials), or null. */
export function targetUrlProblem(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return 'Enter an absolute http(s) address.';
  }
  if (!TARGET_PROTOCOLS.has(parsed.protocol) || parsed.hostname === '') {
    return 'Enter an absolute http(s) address.';
  }
  if (parsed.username !== '' || parsed.password !== '') {
    return 'The address must not carry a user name or password.';
  }
  return null;
}

/** The event types named in `text` (space- or comma-separated), each once, in order. */
export const eventTypesOf = (text: string): string[] => [...new Set(text.split(/[\s,]+/).filter((name) => name !== ''))];

/** Why `text` doesn't name event types the server takes, or null. */
export function eventTypesProblem(text: string): string | null {
  const names = eventTypesOf(text);
  if (names.length === 0 || names.length > MAX_EVENT_TYPES) {
    return `Name 1 to ${String(MAX_EVENT_TYPES)} event types, or ${ALL_EVENTS} for all.`;
  }
  const bad = names.find((name) => !EVENT_TYPE.test(name));
  return bad === undefined ? null : `“${bad}” is not an event type.`;
}

/** Why `secret` is too weak to sign with, or null. */
export const secretProblem = (secret: string): string | null =>
  secret.length < MIN_SECRET_LENGTH ? `The secret needs at least ${String(MIN_SECRET_LENGTH)} characters.` : null;

/** A subscription form's values, as typed. */
export interface SubscriptionDraft {
  target_url: string;
  event_types: string;
  active: boolean;
  /** A new secret; blank keeps the current one when editing. */
  secret: string;
}

/** What is wrong with `draft`, or null; a new subscription must have a secret. */
export function draftProblem(draft: SubscriptionDraft, secretRequired: boolean): string | null {
  return (
    targetUrlProblem(draft.target_url) ??
    eventTypesProblem(draft.event_types) ??
    (secretRequired || draft.secret !== '' ? secretProblem(draft.secret) : null)
  );
}

/** The event types of `text` as the server stores them: each once, space-separated. */
export const normalisedEventTypes = (text: string): string => eventTypesOf(text).join(' ');

/**
 * Only what the user changed against `subscription`, so a save never rewrites what someone else
 * changed: the address trimmed, the event types normalised, and a secret only when one was typed.
 */
export function subscriptionChanges(
  subscription: { target_url: string; event_types: string; active: boolean },
  draft: SubscriptionDraft,
): Partial<SubscriptionDraft> {
  const changes: Partial<SubscriptionDraft> = {};
  if (draft.target_url.trim() !== subscription.target_url) {
    changes.target_url = draft.target_url.trim();
  }
  if (normalisedEventTypes(draft.event_types) !== subscription.event_types) {
    changes.event_types = normalisedEventTypes(draft.event_types);
  }
  if (draft.active !== subscription.active) {
    changes.active = draft.active;
  }
  if (draft.secret !== '') {
    changes.secret = draft.secret;
  }
  return changes;
}

/** A new random signing secret, as hex. */
export function generateSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SECRET_BYTES));
  return [...bytes].map((byte) => byte.toString(HEX).padStart(2, '0')).join('');
}
