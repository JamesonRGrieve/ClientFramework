// SPDX-License-Identifier: AGPL-3.0-or-later
// How the mirror's values are shown: amounts exactly as the store wrote them, and only web links.
import { serverInstant } from 'zephyrex';

const LINKABLE_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:']);

/** An amount with its currency, exactly as the store wrote it (never float arithmetic); a dash when unknown. */
export function amount(value: string | null | undefined, currency: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return currency === null || currency === undefined || currency === '' ? value : `${value} ${currency}`;
}

/** `value` as a link target when it is an http(s) address, else null: store data is shown, never trusted as a link. */
export function linkTarget(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  try {
    return LINKABLE_PROTOCOLS.has(new URL(value).protocol) ? value : null;
  } catch {
    return null;
  }
}

/** A status as a word: "shipped" → "Shipped". */
export const statusLabel = (status: string): string => `${status.charAt(0).toUpperCase()}${status.slice(1)}`;

/** A store timestamp in the user's own time; a dash when there is none. */
export function shownTime(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const at = serverInstant(value);
  return Number.isNaN(at.getTime()) ? value : at.toLocaleString();
}
