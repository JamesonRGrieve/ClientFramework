// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Optimistic-concurrency preconditions (RFC 9110 §13.1.1), in parity with
 * server-framework's stale-save contract: a row's entity tag is its serialised
 * `updated_at`, quoted and opaque, and an unsafe write that names a stale
 * tag in `If-Match` is refused with 412 rather than overwriting a newer edit.
 */

/**
 * An entity-tag's opaque value, as server-framework reads it (zephyrex.lib.Preconditions):
 * the `W/` prefix a compressing proxy may add and the quotes are not part of the version.
 */
const ENTITY_TAG = /(?:W\/)?"([^"]*)"/g;
const ANY_VERSION = '*';

export type IfMatchResult = 'absent' | 'match' | 'mismatch';

/**
 * The `updated_at` to stamp on a write: now, but always strictly after the row's
 * previous stamp, so two saves inside one clock tick still get distinct tags.
 */
export function nextUpdateStamp(previous: Date, now: Date = new Date()): Date {
  return new Date(Math.max(now.getTime(), previous.getTime() + 1));
}

/** The strong entity tag for a validator string: the string itself, quoted. */
export function entityTag(validator: string): string {
  return `"${validator}"`;
}

/**
 * Evaluates `If-Match` against the current validator, in parity with server-framework:
 * `*` matches any current representation; otherwise the header names a set of versions
 * (every quoted tag, `W/` ignored, or the bare value when it holds none) and matches
 * when the current one is among them.
 */
export function evaluateIfMatch(header: string | null, currentValidator: string): IfMatchResult {
  const value = header?.trim() ?? '';
  if (value === '') {
    return 'absent';
  }
  if (value === ANY_VERSION) {
    return 'match';
  }
  const tagged = [...value.matchAll(ENTITY_TAG)].map((match) => match[1]);
  const versions = tagged.length > 0 ? tagged : [value];
  return versions.includes(currentValidator) ? 'match' : 'mismatch';
}
