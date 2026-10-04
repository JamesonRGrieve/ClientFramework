// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookPage } from './BookPage';
import { renderBook } from './testing.mocks';

describe('BookPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the book with its details and chapters', async () => {
    const view = renderBook(<BookPage params={{ bookId: 'notes' }} />);
    expect(await view.findByRole('heading', { level: 1, name: 'Notes on the Analytical Engine' })).toBeInTheDocument();
    expect(view.getByLabelText('Title')).toHaveValue('Notes on the Analytical Engine');
    expect(await view.findByRole('list', { name: 'Chapters' })).toHaveTextContent('Note G');
  });

  it('says when the book is not the user’s to see', async () => {
    const view = renderBook(<BookPage params={{ bookId: 'gone' }} />);
    expect(await view.findByText('This book does not exist or is not yours to see.')).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Back to your books' })).toHaveAttribute('href', '/book');
  });
});
