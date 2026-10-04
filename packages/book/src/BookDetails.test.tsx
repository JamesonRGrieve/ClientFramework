// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bookFixture, bookOf, type BookStore } from './book.mocks';
import type { Book } from './bookApi';
import { BookDetails, bookChanges } from './BookDetails';
import { renderBook } from './testing.mocks';

const SAVE = 'Save';
const CHANGED_ELSEWHERE = '2026-10-03T12:00:00.000002';

const notesOf = (store: BookStore): Book => bookOf(store, 'notes');

describe('bookChanges', () => {
  const book = notesOf(bookFixture());
  const draft = {
    title: book.title,
    author: book.author ?? '',
    description: '',
    genre: book.genre ?? '',
    language: book.language,
    status: book.status,
  };

  it('is empty when nothing changed', () => {
    expect(bookChanges(book, draft)).toEqual({});
  });

  it('keeps only what changed, trimmed, with a cleared field unset', () => {
    expect(bookChanges(book, { ...draft, title: ' Notes ', genre: '  ', status: 'published' })).toEqual({
      title: 'Notes',
      genre: null,
      status: 'published',
    });
  });
});

describe('BookDetails', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves only the changed details over the book as loaded', async () => {
    const store = bookFixture();
    const user = userEvent.setup();
    const view = renderBook(<BookDetails book={notesOf(store)} />, store);
    await user.selectOptions(view.getByLabelText('Status'), 'review');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Saved.');
    expect(notesOf(store)).toMatchObject({ status: 'review', genre: 'Mathematics' });
  });

  it('keeps the user’s edit beside the book as it is now when someone changed it first', async () => {
    const store = bookFixture();
    const loaded = notesOf(store);
    const user = userEvent.setup();
    const view = renderBook(<BookDetails book={loaded} />, store);
    store.books = store.books.map((book) =>
      book.id === 'notes' ? { ...book, genre: 'History', updated_at: CHANGED_ELSEWHERE } : book,
    );
    const genre = view.getByLabelText('Genre');
    await user.clear(genre);
    await user.type(genre, 'Computing');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('radio', { name: 'Yours: Computing' })).toBeChecked();
    expect(view.getByRole('radio', { name: 'Current: History' })).not.toBeChecked();
    expect(notesOf(store).genre).toBe('History');

    await user.click(view.getByRole('button', { name: 'Save merged' }));
    expect(await view.findByRole('status')).toHaveTextContent('Saved.');
    expect(notesOf(store).genre).toBe('Computing');
  });

  it('offers the book’s downloads', () => {
    const store = bookFixture();
    const view = renderBook(<BookDetails book={notesOf(store)} />, store);
    expect(view.getByRole('link', { name: 'EPUB' }).getAttribute('href')).toMatch(/\/v1\/book\/notes\/export\?format=epub$/);
    expect(view.getByRole('link', { name: 'Markdown' })).toHaveAttribute('download');
  });

  it('deletes the book after confirming, and goes back to the books', async () => {
    const store = bookFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderBook(<BookDetails book={notesOf(store)} />, store);
    await user.click(view.getByRole('button', { name: 'Delete this book' }));
    await user.click(view.getByRole('button', { name: 'Yes, delete Notes on the Analytical Engine' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/book');
    });
    expect(store.books.map(({ id }) => id)).toEqual(['letters']);
  });
});
