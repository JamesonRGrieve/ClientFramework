// SPDX-License-Identifier: AGPL-3.0-or-later

const ZONED = /(?:[zZ]|[+-]\d{2}:\d{2})$/;

/**
 * The instant a server timestamp names. The server keeps UTC and may leave the zone off, so a
 * timestamp without one is read as UTC.
 */
export function serverInstant(value: string): Date {
  return new Date(ZONED.test(value) ? value : `${value}Z`);
}

/** A server timestamp in the user's own time; empty when there is none. */
export const shownTime = (value: string | null | undefined): string =>
  value === null || value === undefined || value === '' ? '' : serverInstant(value).toLocaleString();
