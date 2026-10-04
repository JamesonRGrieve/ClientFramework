// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { bookExtension as registered } from 'zephyrex/extensions';
import { BookPage } from './BookPage';
import { BooksPage } from './BooksPage';
import { bookExtension } from './extension';

describe('bookExtension', () => {
  it('is the registered book extension, with the books pages and a menu entry', () => {
    expect(bookExtension).toMatchObject({ name: 'book', serverExtension: 'book' });
    expect(bookExtension.displayName).toBe(registered.displayName);
    expect(bookExtension.pages).toEqual([
      { path: '/book', component: BooksPage },
      { path: '/book/:bookId', component: BookPage },
    ]);
    expect(bookExtension.navItems).toEqual([{ title: 'Books', url: '/book' }]);
  });
});
