// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  draftProblem,
  eventTypesOf,
  eventTypesProblem,
  generateSecret,
  MIN_SECRET_LENGTH,
  normalisedEventTypes,
  secretProblem,
  subscriptionChanges,
  targetUrlProblem,
} from './webhookModel';

const URL_PROBLEM = 'Enter an absolute http(s) address.';
const HOOK_URL = 'https://hooks.example.com/orders';
const SECRET = 'a-secret-of-sixteen-plus';

describe('webhookModel', () => {
  it('takes only an absolute http(s) address with a host and no credentials', () => {
    expect(targetUrlProblem(HOOK_URL)).toBeNull();
    expect(targetUrlProblem(' http://localhost:8080/h ')).toBeNull();
    expect(targetUrlProblem('/relative')).toBe(URL_PROBLEM);
    expect(targetUrlProblem('ftp://example.com/h')).toBe(URL_PROBLEM);
    expect(targetUrlProblem('https://user:pass@example.com/h')).toBe('The address must not carry a user name or password.');
  });

  it('reads event types split by spaces or commas, each once, and checks them as the server does', () => {
    expect(eventTypesOf('order.created, order.refunded order.created')).toEqual(['order.created', 'order.refunded']);
    expect(normalisedEventTypes(' a,b  c ')).toBe('a b c');
    expect(eventTypesProblem('*')).toBeNull();
    expect(eventTypesProblem('team:member-added')).toBeNull();
    expect(eventTypesProblem('')).toBe('Name 1 to 50 event types, or * for all.');
    expect(eventTypesProblem('ok .bad')).toBe('“.bad” is not an event type.');
  });

  it('wants a secret of at least the server’s length, and generates a long random one', () => {
    expect(secretProblem('short')).toBe(`The secret needs at least ${String(MIN_SECRET_LENGTH)} characters.`);
    expect(secretProblem(SECRET)).toBeNull();
    const secret = generateSecret();
    expect(secret).toMatch(/^[\da-f]{64}$/);
    expect(generateSecret()).not.toBe(secret);
  });

  it('needs a secret for a new subscription, and checks an edit’s only when one is typed', () => {
    const draft = { target_url: HOOK_URL, event_types: '*', active: true, secret: '' };
    expect(draftProblem(draft, true)).toBe(`The secret needs at least ${String(MIN_SECRET_LENGTH)} characters.`);
    expect(draftProblem(draft, false)).toBeNull();
    expect(draftProblem({ ...draft, secret: 'short' }, false)).not.toBeNull();
    expect(draftProblem({ ...draft, target_url: 'nope' }, false)).toBe(URL_PROBLEM);
  });

  it('keeps only what changed, normalised, and a secret only when one was typed', () => {
    const stored = { target_url: HOOK_URL, event_types: 'order.created', active: true };
    expect(subscriptionChanges(stored, { ...stored, target_url: ` ${HOOK_URL} `, secret: '' })).toEqual({});
    expect(
      subscriptionChanges(stored, {
        target_url: HOOK_URL,
        event_types: 'order.created, order.paid',
        active: false,
        secret: SECRET,
      }),
    ).toEqual({ event_types: 'order.created order.paid', active: false, secret: SECRET });
  });
});
