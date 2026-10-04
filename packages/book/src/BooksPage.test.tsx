// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bookFixture } from './book.mocks';
import { BooksPage } from './BooksPage';
import { renderBook } from './testing.mocks';

describe('BooksPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the books by title, each linking to its page with its author and status', async () => {
    const view = renderBook(<BooksPage />);
    const list = await view.findByRole('list', { name: 'Books' });
    expect(
      within(list)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Letters', '/book/letters'],
      ['Notes on the Analytical Engine', '/book/notes'],
    ]);
    expect(within(list).getByText('by Ada Lovelace')).toBeInTheDocument();
    expect(within(list).getByText('Editing')).toBeInTheDocument();
  });

  it('starts a book and opens its page', async () => {
    const store = bookFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderBook(<BooksPage />, store);
    await user.type(await view.findByLabelText('Title'), 'Sketches');
    await user.click(view.getByRole('button', { name: 'Start a book' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/book/book-1');
    });
    expect(store.books.at(-1)).toMatchObject({ id: 'book-1', title: 'Sketches', author: null });
  });

  it('says so when there are no books', async () => {
    const view = renderBook(<BooksPage />, { books: [], chapters: [] });
    expect(await view.findByText('You have no books yet.')).toBeInTheDocument();
  });
});
