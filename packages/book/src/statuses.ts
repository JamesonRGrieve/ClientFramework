// SPDX-License-Identifier: AGPL-3.0-or-later
import type { BookStatus, ExportFormat } from './bookApi';

const STATUS_LABELS: Readonly<Record<BookStatus, string>> = {
  draft: 'Draft',
  review: 'In review',
  editing: 'Editing',
  finalized: 'Finalized',
  published: 'Published',
  archived: 'Archived',
};

/** Where a book is in its life, in words. */
export const statusLabel = (status: BookStatus): string => STATUS_LABELS[status];

const FORMAT_LABELS: Readonly<Record<ExportFormat, string>> = {
  markdown: 'Markdown',
  html: 'HTML',
  epub: 'EPUB',
};

/** A download format's name. */
export const formatLabel = (format: ExportFormat): string => FORMAT_LABELS[format];
