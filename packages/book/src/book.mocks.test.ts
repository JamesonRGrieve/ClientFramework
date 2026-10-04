// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom } from 'zephyrex/testing/msw';
import { bookFixture, bookHandlers, bookOf, countWords, FIXTURE_VERSION } from './book.mocks';

const BASE = 'http://localhost:1996';
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_PRECONDITION_FAILED = 412;
const HTTP_PRECONDITION_REQUIRED = 428;
const LOADED = `"${FIXTURE_VERSION}"`;

const json = (body: object, ifMatch?: string): RequestInit => ({
  method: 'PUT',
  body: JSON.stringify(body),
  headers: ifMatch === undefined ? {} : { 'If-Match': ifMatch },
});

describe('the mock book server', () => {
  it('lists books, and a book’s chapters by book', async () => {
    const send = fetchFrom(bookHandlers());
    await expect((await send(`${BASE}/v1/book`)).json()).resolves.toMatchObject({
      books: [{ id: 'notes' }, { id: 'letters' }],
    });
    await expect((await send(`${BASE}/v1/book_chapter?book_id=letters`)).json()).resolves.toEqual({ book_chapters: [] });
    expect((await send(`${BASE}/v1/book/gone`)).status).toBe(HTTP_NOT_FOUND);
  });

  it('holds a change to the book’s version: 428 without one, 412 for an older one', async () => {
    const store = bookFixture();
    const send = fetchFrom(bookHandlers(store));
    expect((await send(`${BASE}/v1/book/notes`, json({ book: { title: 'Notes' } }))).status).toBe(
      HTTP_PRECONDITION_REQUIRED,
    );
    const saved = await send(`${BASE}/v1/book/notes`, json({ book: { title: 'Notes' } }, LOADED));
    expect(saved.status).toBe(HTTP_OK);
    expect((await send(`${BASE}/v1/book/notes`, json({ book: { title: 'Again' } }, LOADED))).status).toBe(
      HTTP_PRECONDITION_FAILED,
    );
    expect(store.books.find(({ id }) => id === 'notes')?.title).toBe('Notes');
  });

  it('recounts a chapter’s words when its text changes', async () => {
    const store = bookFixture();
    const send = fetchFrom(bookHandlers(store));
    await send(`${BASE}/v1/book_chapter/c3`, json({ book_chapter: { content: 'Three short words' } }, LOADED));
    expect(store.chapters.find(({ id }) => id === 'c3')).toMatchObject({ content: 'Three short words', word_count: 3 });
  });

  it('finds a fixture book by id, and refuses one that is not there', () => {
    expect(bookOf(bookFixture(), 'letters').title).toBe('Letters');
    expect(() => bookOf(bookFixture(), 'gone')).toThrow('No book gone in the fixture');
  });

  it('counts words as runs of non-space', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('  one\ttwo\nthree  ')).toBe(3);
  });
});
