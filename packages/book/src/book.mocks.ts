// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory book server for the package's tests and stories (never compiled into dist): the
// routes and shapes of the server's book extension, holding every change to its version.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { notFound, refuseStale, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import { BOOK_ENDPOINT, type Book, BookSchema, CHAPTER_ENDPOINT, type Chapter, ChapterSchema } from './bookApi';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;

/** When the fixture's rows were recorded: their version until a test or story changes one. */
export const FIXTURE_VERSION = '2026-10-01T09:00:00.000001';

const book = (id: string, title: string, extra: Partial<Book> = {}): Book => ({
  id,
  title,
  author: 'Ada Lovelace',
  description: null,
  genre: null,
  language: 'en',
  status: 'draft',
  created_at: FIXTURE_VERSION,
  updated_at: null,
  ...extra,
});

const chapter = (id: string, bookId: string, position: number, title: string, content: string): Chapter => ({
  id,
  book_id: bookId,
  title,
  content,
  position,
  word_count: countWords(content),
  created_at: FIXTURE_VERSION,
  updated_at: null,
});

/** Words as the server counts them: runs of non-space. */
export function countWords(content: string): number {
  return content.split(/\s+/).filter((word) => word !== '').length;
}

/** Two books, the first with three chapters. */
export function bookFixture(): { books: Book[]; chapters: Chapter[] } {
  return {
    books: [
      book('notes', 'Notes on the Analytical Engine', { genre: 'Mathematics', status: 'editing' }),
      book('letters', 'Letters', { author: null }),
    ],
    // Positions follow the list, from 1.
    chapters: [
      ['c1', 'The engine', 'The Analytical Engine weaves algebraic patterns.'],
      ['c2', 'Note G', 'A method for computing Bernoulli numbers.'],
      ['c3', 'Afterword', ''],
    ].map(([id = '', title = '', content = ''], index) => chapter(id, 'notes', index + 1, title, content)),
  };
}

export type BookStore = ReturnType<typeof bookFixture>;

/** `store`'s book `id`; a test or story naming one that isn't there is a mistake in it. */
export function bookOf(store: BookStore, id: string): Book {
  const found = store.books.find((row) => row.id === id);
  if (found === undefined) {
    throw new Error(`No book ${id} in the fixture`);
  }
  return found;
}

const BookBodySchema = z.object({ book: BookSchema.omit({ id: true }).partial() });
const ChapterBodySchema = z.object({ book_chapter: ChapterSchema.omit({ id: true }).partial() });

/** The fields a partial body actually sets, without the ones it leaves undefined. */
const defined = (fields: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

/** The book routes over `store`, each change held to the row's version as the server does. */
export function bookHandlers(store: BookStore = bookFixture()): RequestHandler[] {
  let created = 0;
  const nextId = (prefix: string): string => `${prefix}-${String(++created)}`;
  return [
    http.get(`*${BOOK_ENDPOINT}`, () => HttpResponse.json({ books: store.books })),
    http.get(`*${BOOK_ENDPOINT}/:id`, ({ params: { id } }) => {
      const found = store.books.find((row) => row.id === id);
      return found === undefined ? notFound() : HttpResponse.json({ book: found });
    }),
    http.post(`*${BOOK_ENDPOINT}`, async ({ request }) => {
      const { book: fields } = BookBodySchema.parse(await request.json());
      const row = BookSchema.parse({
        ...book(nextId('book'), ''),
        author: null,
        ...defined(fields),
        created_at: versionStamp(),
      });
      store.books.push(row);
      return HttpResponse.json({ book: row }, { status: HTTP_CREATED });
    }),
    http.put(`*${BOOK_ENDPOINT}/:id`, async ({ params: { id }, request }) => {
      const index = store.books.findIndex((row) => row.id === id);
      const current = store.books.at(index);
      if (index < 0 || current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      const { book: fields } = BookBodySchema.parse(await request.json());
      const updated = BookSchema.parse({ ...current, ...defined(fields), updated_at: versionStamp() });
      store.books.splice(index, 1, updated);
      return HttpResponse.json({ book: updated });
    }),
    http.delete(`*${BOOK_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = store.books.find((row) => row.id === id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      store.books = store.books.filter((row) => row.id !== id);
      store.chapters = store.chapters.filter((row) => row.book_id !== id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
    http.get(`*${CHAPTER_ENDPOINT}`, ({ request }) => {
      const bookId = new URL(request.url).searchParams.get('book_id');
      return HttpResponse.json({
        book_chapters: store.chapters.filter((row) => bookId === null || row.book_id === bookId),
      });
    }),
    http.post(`*${CHAPTER_ENDPOINT}`, async ({ request }) => {
      const { book_chapter: fields } = ChapterBodySchema.parse(await request.json());
      const row = ChapterSchema.parse({
        ...chapter(nextId('chapter'), '', 1, '', ''),
        ...defined(fields),
        created_at: versionStamp(),
      });
      store.chapters.push(row);
      return HttpResponse.json({ book_chapter: row }, { status: HTTP_CREATED });
    }),
    http.put(`*${CHAPTER_ENDPOINT}/:id`, async ({ params: { id }, request }) => {
      const index = store.chapters.findIndex((row) => row.id === id);
      const current = store.chapters.at(index);
      if (index < 0 || current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      const { book_chapter: fields } = ChapterBodySchema.parse(await request.json());
      const merged = { ...current, ...defined(fields) };
      const updated = ChapterSchema.parse({
        ...merged,
        word_count: countWords(merged.content),
        updated_at: versionStamp(),
      });
      store.chapters.splice(index, 1, updated);
      return HttpResponse.json({ book_chapter: updated });
    }),
    http.delete(`*${CHAPTER_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = store.chapters.find((row) => row.id === id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      store.chapters = store.chapters.filter((row) => row.id !== id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
  ];
}
