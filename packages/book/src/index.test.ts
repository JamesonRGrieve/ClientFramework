// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/book', () => {
  it('publishes the book pages, their reads and writes, and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'BOOK_ENDPOINT',
        'BOOK_PATH',
        'BOOK_STATUSES',
        'BookPage',
        'BookSchema',
        'BooksPage',
        'CHAPTER_ENDPOINT',
        'ChapterSchema',
        'EXPORT_FORMATS',
        'bookExtension',
        'bookPagePath',
        'createBook',
        'createChapter',
        'exportUrl',
        'useBook',
        'useBookActions',
        'useBooks',
        'useChapterActions',
        'useChapters',
      ].sort(),
    );
    expect(published.BOOK_ENDPOINT).toBe('/v1/book');
    expect(published.CHAPTER_ENDPOINT).toBe('/v1/book_chapter');
  });
});
