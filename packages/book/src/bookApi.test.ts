// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { bookFixture, bookHandlers, type BookStore, FIXTURE_VERSION } from './book.mocks';
import {
  createBook,
  createChapter,
  exportUrl,
  useBook,
  useBookActions,
  useBooks,
  useChapterActions,
  useChapters,
} from './bookApi';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

/** `rows`' row `id`; a test naming one the fixture lacks is a mistake in it. */
function rowOf<T extends { id: string }>(rows: readonly T[], id: string): T {
  const found = rows.find((row) => row.id === id);
  if (found === undefined) {
    throw new Error(`No ${id} in the fixture`);
  }
  return found;
}

describe('the book API', () => {
  let store: BookStore;

  beforeEach(() => {
    store = bookFixture();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(bookHandlers(store))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the books', async () => {
    const { result } = renderHook(() => useBooks(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data?.map(({ id }) => id)).toEqual(['notes', 'letters']);
    });
  });

  it('reads one book', async () => {
    const { result } = renderHook(() => useBook('notes'), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data?.title).toBe('Notes on the Analytical Engine');
    });
  });

  it('reads a book that is not there, or not the user’s, as null', async () => {
    const { result } = renderHook(() => useBook('gone'), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });

  it('reads a book’s chapters in order, whatever order the server keeps them in', async () => {
    store.chapters.reverse();
    const { result } = renderHook(() => useChapters('notes'), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data?.map(({ position }) => position)).toEqual([1, 2, 3]);
    });
  });

  it('creates a book and a chapter, as the server stores them', async () => {
    const book = await createBook(client, { title: 'Sketches', author: 'Ada' });
    expect(book).toMatchObject({ title: 'Sketches', author: 'Ada', status: 'draft', language: 'en' });
    const chapter = await createChapter(client, book.id, 'One', 1);
    expect(chapter).toMatchObject({ book_id: book.id, title: 'One', position: 1, word_count: 0 });
    expect(store.chapters).toContainEqual(chapter);
  });

  it('downloads a book by its export address', () => {
    expect(exportUrl(client, 'notes', 'epub')).toBe(`${testConfig.server.baseUrl}/v1/book/notes/export?format=epub`);
  });

  it('changes a book only at the version it was loaded at', async () => {
    const { result } = renderHook(() => useBookActions('notes'), { wrapper: TestWrapper });
    const loaded = rowOf(store.books, 'notes');
    await act(async () => {
      await expect(result.current.update.save(loaded, { status: 'review' })).resolves.toBe(true);
    });
    expect(rowOf(store.books, 'notes').status).toBe('review');
    await act(async () => {
      await expect(result.current.update.save(loaded, { genre: 'History' })).resolves.toBe(false);
    });
    expect(result.current.update.conflict).toMatchObject({ mine: { genre: 'History' }, theirs: { status: 'review' } });
    expect(rowOf(store.books, 'notes').genre).toBe('Mathematics');
  });

  it('changes and deletes a chapter at its version, recounting its words', async () => {
    const { result } = renderHook(() => useChapterActions('notes'), { wrapper: TestWrapper });
    const afterword = rowOf(store.chapters, 'c3');
    expect(afterword.created_at).toBe(FIXTURE_VERSION);
    await act(async () => {
      await expect(result.current.update.save(afterword, { content: 'Fin of the notes' })).resolves.toBe(true);
    });
    expect(rowOf(store.chapters, 'c3').word_count).toBe(4);
    await act(async () => {
      await expect(result.current.remove.save(afterword, {})).resolves.toBe(false);
    });
    expect(store.chapters.some(({ id }) => id === 'c3')).toBe(true);
  });
});
