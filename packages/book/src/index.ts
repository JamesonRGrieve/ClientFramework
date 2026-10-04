// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's book extension (zephyrex[book]): the user's books and their
// chapters, written here and downloaded as Markdown, HTML or EPUB. Every change to a book or a
// chapter is guarded by its version.
export { bookExtension } from './extension';
export { BookPage } from './BookPage';
export { BooksPage } from './BooksPage';
export { BOOK_PATH, bookPagePath } from './routes';
export {
  BOOK_ENDPOINT,
  BOOK_STATUSES,
  BookSchema,
  CHAPTER_ENDPOINT,
  ChapterSchema,
  createBook,
  createChapter,
  EXPORT_FORMATS,
  exportUrl,
  useBook,
  useBookActions,
  useBooks,
  useChapterActions,
  useChapters,
} from './bookApi';
export type { Book, BookActions, BookStatus, Chapter, ChapterActions, ExportFormat, NewBook } from './bookApi';
