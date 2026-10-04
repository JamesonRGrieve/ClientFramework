// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { BOOK_PATH, bookPagePath } from './routes';

describe('book routes', () => {
  it('puts each book under the books page, its id escaped', () => {
    expect(BOOK_PATH).toBe('/book');
    expect(bookPagePath('b 1/2')).toBe('/book/b%201%2F2');
  });
});
