// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { BOOK_STATUSES, EXPORT_FORMATS } from './bookApi';
import { formatLabel, statusLabel } from './statuses';

describe('book statuses and formats', () => {
  it('names every status in words', () => {
    expect(BOOK_STATUSES.map(statusLabel)).toEqual(['Draft', 'In review', 'Editing', 'Finalized', 'Published', 'Archived']);
  });

  it('names every download format', () => {
    expect(EXPORT_FORMATS.map(formatLabel)).toEqual(['Markdown', 'HTML', 'EPUB']);
  });
});
