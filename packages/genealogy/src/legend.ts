// SPDX-License-Identifier: AGPL-3.0-or-later
// No 'use client': an app's config, read on the server too, can name its legend from this.

/** A kind of tie, and what the graph's legend calls it. */
export interface LegendEntry {
  kind: string;
  label: string;
}

/** The colours the graph draws each kind of tie in, for its legend. */
export const TIE_LEGEND: readonly LegendEntry[] = [
  { kind: 'partnership', label: 'Partners' },
  { kind: 'friendship', label: 'Friends' },
  { kind: 'sibling_of', label: 'Siblings' },
  { kind: 'acquaintance', label: 'Acquaintances' },
  { kind: 'mentorship', label: 'Mentors (arrow to the student)' },
];
