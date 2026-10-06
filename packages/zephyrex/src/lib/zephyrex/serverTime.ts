// SPDX-License-Identifier: AGPL-3.0-or-later

const ZONED = /(?:[zZ]|[+-]\d{2}:\d{2})$/;

/** A date and time joined by a space, as ERPNext writes them (`2026-10-01 09:00:00.000001`). */
const SPACED = /^(\d{4}-\d{2}-\d{2}) /;

/**
 * The instant a server timestamp names. The server keeps UTC and may leave the zone off, so a
 * timestamp without one is read as UTC; one with a space for the `T` (an ERPNext document's
 * version) is read the same.
 */
export function serverInstant(value: string): Date {
  const iso = value.replace(SPACED, '$1T');
  return new Date(ZONED.test(iso) ? iso : `${iso}Z`);
}

/** A server timestamp in the user's own time; empty when there is none. */
export const shownTime = (value: string | null | undefined): string =>
  value === null || value === undefined || value === '' ? '' : serverInstant(value).toLocaleString();
