// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { ApiError, type GuardedSave, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const BOOK_ENDPOINT = '/v1/book';
export const CHAPTER_ENDPOINT = '/v1/book_chapter';

const HTTP_NOT_FOUND = 404;

/** The server's limit on a book's or a chapter's title. */
export const MAX_TITLE_LENGTH = 300;

export const BOOK_STATUSES = ['draft', 'review', 'editing', 'finalized', 'published', 'archived'] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

/** The formats a book downloads in, with the server's chapters in order. */
export const EXPORT_FORMATS = ['markdown', 'html', 'epub'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

const optionalText = z.string().nullable().optional();

export const BookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: optionalText,
  description: optionalText,
  genre: optionalText,
  /** A BCP 47 language tag; the server defaults it to "en". */
  language: z.string(),
  status: z.enum(BOOK_STATUSES),
  user_id: optionalText,
  team_id: optionalText,
  // The row's version, sent back verbatim as If-Match on every change.
  created_at: optionalText,
  updated_at: optionalText,
});
export type Book = z.infer<typeof BookSchema>;

export const ChapterSchema = z.object({
  id: z.string(),
  book_id: z.string(),
  title: z.string(),
  /** Markdown. */
  content: z.string(),
  /** The chapter's place in the book, from 1. */
  position: z.number().int(),
  /** Counted by the server from the content; never sent. */
  word_count: z.number().int(),
  created_at: optionalText,
  updated_at: optionalText,
});
export type Chapter = z.infer<typeof ChapterSchema>;

const BookEnvelopeSchema = z.object({ book: BookSchema });
const ChapterEnvelopeSchema = z.object({ book_chapter: ChapterSchema });

/** What a new book is made from: a title, and the details the user filled in. */
export type NewBook = Pick<Book, 'title'> & Partial<Pick<Book, 'author' | 'description' | 'genre' | 'language'>>;

const bookPath = (bookId: string): string => `${BOOK_ENDPOINT}/${encodeURIComponent(bookId)}`;
const chapterPath = (chapterId: string): string => `${CHAPTER_ENDPOINT}/${encodeURIComponent(chapterId)}`;
const byPosition = (a: Chapter, b: Chapter): number => a.position - b.position;

/** Every book the signed-in user can see. */
export function useBooks(): SWRResponse<Book[], Error> {
  const client = useClient();
  return useSWR<Book[], Error>(client.url(BOOK_ENDPOINT), async () => client.list(BOOK_ENDPOINT, 'books', BookSchema));
}

/** One book, or `null` when it doesn't exist or isn't the user's to see (the server answers 404 for both). */
export function useBook(bookId: string): SWRResponse<Book | null, Error> {
  const client = useClient();
  return useSWR<Book | null, Error>(client.url(bookPath(bookId)), async () => {
    try {
      return BookEnvelopeSchema.parse(await client.get(bookPath(bookId))).book;
    } catch (error) {
      if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  });
}

/** A book's chapters, in order. */
export function useChapters(bookId: string): SWRResponse<Chapter[], Error> {
  const client = useClient();
  const params = { book_id: bookId };
  return useSWR<Chapter[], Error>(client.url(CHAPTER_ENDPOINT, params), async () =>
    (await client.list(CHAPTER_ENDPOINT, 'book_chapters', ChapterSchema, params)).sort(byPosition),
  );
}

/** Creates a book; resolves to what the server stored. */
export async function createBook(client: ZephyrexClient, book: NewBook): Promise<Book> {
  return BookEnvelopeSchema.parse(await client.post(BOOK_ENDPOINT, { book })).book;
}

/** Adds a chapter to `bookId` at `position`; resolves to what the server stored. */
export async function createChapter(
  client: ZephyrexClient,
  bookId: string,
  title: string,
  position: number,
): Promise<Chapter> {
  return ChapterEnvelopeSchema.parse(
    await client.post(CHAPTER_ENDPOINT, { book_chapter: { book_id: bookId, title, position } }),
  ).book_chapter;
}

/** Where the browser downloads a book in `format`; the session cookie authenticates the link. */
export const exportUrl = (client: ZephyrexClient, bookId: string, format: ExportFormat): string =>
  client.url(`${bookPath(bookId)}/export`, { format });

export interface BookActions {
  /** `update.save(book, changes)`: change a book's details, guarded by it as loaded. */
  update: GuardedSave<Book>;
  /** `remove.save(book, {})`: delete a book, guarded by it as loaded. */
  remove: GuardedSave<Book>;
}

/** The writes to a book, each refreshing the books (and the book) shown. */
export function useBookActions(bookId: string): BookActions {
  const client = useClient();
  const { mutate: refreshBooks } = useBooks();
  const { mutate: refreshBook } = useBook(bookId);
  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([refreshBooks(), refreshBook()]);
  }, [refreshBooks, refreshBook]);
  const update = useCallback(
    async (seen: Book, changes: Partial<Book>): Promise<void> => {
      await client.put(bookPath(seen.id), { book: changes }, seen);
      await refresh();
    },
    [client, refresh],
  );
  const remove = useCallback(
    async (seen: Book): Promise<void> => {
      await client.delete(bookPath(seen.id), seen);
      await refreshBooks();
    },
    [client, refreshBooks],
  );
  return { update: useGuardedSave(update, BookSchema), remove: useGuardedSave(remove, BookSchema) };
}

export interface ChapterActions {
  /** `update.save(chapter, changes)`: change a chapter, guarded by it as loaded. */
  update: GuardedSave<Chapter>;
  /** `remove.save(chapter, {})`: delete a chapter, guarded by it as loaded. */
  remove: GuardedSave<Chapter>;
}

/** The writes to `bookId`'s chapters, each refreshing them. */
export function useChapterActions(bookId: string): ChapterActions {
  const client = useClient();
  const { mutate: refreshChapters } = useChapters(bookId);
  const update = useCallback(
    async (seen: Chapter, changes: Partial<Chapter>): Promise<void> => {
      await client.put(chapterPath(seen.id), { book_chapter: changes }, seen);
      await refreshChapters();
    },
    [client, refreshChapters],
  );
  const remove = useCallback(
    async (seen: Chapter): Promise<void> => {
      await client.delete(chapterPath(seen.id), seen);
      await refreshChapters();
    },
    [client, refreshChapters],
  );
  return { update: useGuardedSave(update, ChapterSchema), remove: useGuardedSave(remove, ChapterSchema) };
}
