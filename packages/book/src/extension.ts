// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { bookExtension as registered } from 'zephyrex/extensions';
import { BookPage } from './BookPage';
import { BooksPage } from './BooksPage';
import { BOOK_PATH } from './routes';

/** The book client extension with its pages and menu entry, for an app's `extensions`: the user's books. */
export const bookExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: BOOK_PATH, component: BooksPage },
    { path: `${BOOK_PATH}/:bookId`, component: BookPage },
  ],
  navItems: [{ title: 'Books', url: BOOK_PATH }],
};
