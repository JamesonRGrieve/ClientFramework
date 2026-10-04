// SPDX-License-Identifier: AGPL-3.0-or-later
/** Where the book pages mount in the app (the extension's routes and links). */
export const BOOK_PATH = '/book';

export const bookPagePath = (bookId: string): string => `${BOOK_PATH}/${encodeURIComponent(bookId)}`;
