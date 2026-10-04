// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBooks } from './bookApi';
import { renderBook } from './testing.mocks';

function BookCount(): string {
  return `${String(useBooks().data?.length ?? 0)} books`;
}

describe('renderBook', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders under the Zephyrex test app, answering the book routes from the given store', async () => {
    const view = renderBook(<BookCount />);
    expect(await view.findByText('2 books')).toBeInTheDocument();
  });

  it('serves no books from an empty store', async () => {
    const view = renderBook(<BookCount />, { books: [], chapters: [] });
    expect(await view.findByText('0 books')).toBeInTheDocument();
  });
});
