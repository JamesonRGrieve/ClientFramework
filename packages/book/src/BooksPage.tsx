// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { type Book, createBook, MAX_TITLE_LENGTH, useBooks } from './bookApi';
import { bookPagePath } from './routes';
import { statusLabel } from './statuses';

const byTitle = (a: Book, b: Book): number => a.title.localeCompare(b.title);

/** Start a book: a title (required) and an author, then on to its page to write it. */
function NewBookForm(): ReactElement {
  const client = useClient();
  const router = useRouter();
  const { mutate: refreshBooks } = useBooks();
  const ids = { title: useId(), author: useId() };
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (title.trim() === '') {
      setProblem('Give the book a title.');
      return;
    }
    setPending(true);
    const creating = (async (): Promise<void> => {
      const book = await createBook(client, {
        title: title.trim(),
        ...(author.trim() === '' ? {} : { author: author.trim() }),
      });
      await refreshBooks();
      router.push(bookPagePath(book.id));
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(creating, 'The book could not be created.'));
      setPending(false);
    })();
  };

  return (
    <form className='grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end' onSubmit={submit}>
      <div className='grid gap-1'>
        <Label htmlFor={ids.title}>Title</Label>
        <Input
          id={ids.title}
          value={title}
          maxLength={MAX_TITLE_LENGTH}
          required
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.author}>Author (optional)</Label>
        <Input id={ids.author} value={author} onChange={(event) => setAuthor(event.target.value)} />
      </div>
      <Button type='submit' disabled={pending}>
        Start a book
      </Button>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive sm:col-span-3'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** The user's books, each opening its page, and a form to start another. */
export function BooksPage(): ReactElement {
  const books = useBooks();
  const shown = [...(books.data ?? [])].sort(byTitle);

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <Card>
        <CardHeader>
          <CardTitle>Books</CardTitle>
          <CardDescription>The books you are writing, and the ones you have published.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6'>
          <NewBookForm />
          {books.error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The books could not be loaded: {books.error.message}
            </p>
          )}
          {books.error === undefined && shown.length === 0 && (
            <p className='text-sm text-muted-foreground'>{books.isLoading ? 'Loading…' : 'You have no books yet.'}</p>
          )}
          {shown.length > 0 && (
            <ul aria-label='Books' className='divide-y rounded-md border'>
              {shown.map((book) => (
                <li key={book.id} className='flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm'>
                  <span>
                    <Link href={bookPagePath(book.id)} className='font-medium hover:underline'>
                      {book.title}
                    </Link>
                    {(book.author ?? '') !== '' && <span className='text-muted-foreground'> by {book.author}</span>}
                  </span>
                  <span className='text-muted-foreground'>{statusLabel(book.status)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
