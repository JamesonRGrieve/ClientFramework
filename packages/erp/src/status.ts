// SPDX-License-Identifier: AGPL-3.0-or-later
// A document's docstatus as people read it.
const DRAFT = 0;
const SUBMITTED = 1;
const CANCELLED = 2;

const LABELS: Readonly<Record<number, string>> = { [DRAFT]: 'Draft', [SUBMITTED]: 'Submitted', [CANCELLED]: 'Cancelled' };

/** Draft, Submitted or Cancelled; empty for a DocType that has no such status. */
export const statusLabel = (docstatus: number | undefined): string =>
  docstatus === undefined ? '' : (LABELS[docstatus] ?? '');

/** Whether a document is a draft that may be submitted, or submitted and may be cancelled. */
export const isDraft = (docstatus: number | undefined): boolean => docstatus === DRAFT;
export const isSubmitted = (docstatus: number | undefined): boolean => docstatus === SUBMITTED;
