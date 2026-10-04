// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import type { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { useBook } from './bookApi';
import { BookDetails } from './BookDetails';
import { Chapters } from './Chapters';
import { BOOK_PATH } from './routes';

/** One book: its details and downloads, and its chapters. */
export function BookPage({ params }: { params: Record<string, string> }): ReactElement {
  const bookId = params['bookId'] ?? '';
  const book = useBook(bookId);

  if (book.error !== undefined) {
    return (
      <p role='alert' className='p-4 text-sm text-destructive'>
        The book could not be loaded: {book.error.message}
      </p>
    );
  }
  if (book.data === undefined || book.data === null) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>
        {book.isLoading ? 'Loading…' : 'This book does not exist or is not yours to see.'}{' '}
        <Link href={BOOK_PATH} className='underline'>
          Back to your books
        </Link>
      </p>
    );
  }

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='grid gap-1'>
        <Link href={BOOK_PATH} className='text-sm text-muted-foreground underline'>
          Books
        </Link>
        <h1 className='text-3xl font-semibold'>{book.data.title}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BookDetails key={book.data.id} book={book.data} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Chapters</CardTitle>
        </CardHeader>
        <CardContent>
          <Chapters bookId={book.data.id} />
        </CardContent>
      </Card>
    </main>
  );
}
