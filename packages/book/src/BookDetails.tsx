// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type ConflictField, ConflictPanel, useClient, useDraft, useEditBase } from 'zephyrex';
import { Textarea } from 'zephyrex/ui/textarea';
import {
  BOOK_STATUSES,
  type Book,
  type BookStatus,
  EXPORT_FORMATS,
  exportUrl,
  MAX_TITLE_LENGTH,
  useBookActions,
} from './bookApi';
import { BOOK_PATH } from './routes';
import { formatLabel, statusLabel } from './statuses';

const SAVE_FAILURE = 'The book could not be saved.';
const REMOVE_FAILURE = 'The book could not be deleted.';

const CONFLICT_FIELDS: readonly ConflictField<Book>[] = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'description', label: 'Description' },
  { key: 'genre', label: 'Genre' },
  { key: 'language', label: 'Language' },
  { key: 'status', label: 'Status', format: ({ status }) => (status === undefined ? '' : statusLabel(status)) },
];

/** The form's text as the field it edits: a cleared optional field is unset (null). */
const optional = (value: string): string | null => (value.trim() === '' ? null : value.trim());

const isStatus = (value: string): value is BookStatus => BOOK_STATUSES.some((status) => status === value);

/** The details form's values, as typed. */
export interface BookDraft {
  title: string;
  author: string;
  description: string;
  genre: string;
  language: string;
  status: BookStatus;
}

const OPTIONAL_FIELDS = ['author', 'description', 'genre'] as const;

const draftOf = (book: Book): BookDraft => ({
  title: book.title,
  author: book.author ?? '',
  description: book.description ?? '',
  genre: book.genre ?? '',
  language: book.language,
  status: book.status,
});

/** Only the fields the user changed, so a save never rewrites what someone else changed. */
export function bookChanges(book: Book, draft: BookDraft): Partial<Book> {
  const changes: Partial<Book> = {};
  const title = draft.title.trim();
  if (title !== book.title) {
    changes.title = title;
  }
  for (const field of OPTIONAL_FIELDS) {
    const value = optional(draft[field]);
    if (value !== (book[field] ?? null)) {
      changes[field] = value;
    }
  }
  const language = draft.language.trim();
  if (language !== book.language) {
    changes.language = language;
  }
  if (draft.status !== book.status) {
    changes.status = draft.status;
  }
  return changes;
}

/** A book's details, saved over the book as loaded; its downloads; and deleting it. */
export function BookDetails({ book }: { book: Book }): ReactElement {
  const client = useClient();
  const router = useRouter();
  const ids = {
    title: useId(),
    author: useId(),
    description: useId(),
    genre: useId(),
    language: useId(),
    status: useId(),
  };
  const { update, remove } = useBookActions(book.id);
  // The form edits, and saves over, the book it was filled from until the user's save lands.
  const { base, rebaseOnSave } = useEditBase(book);
  const [draft, setDraft] = useDraft(base, draftOf);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const edit = (field: Exclude<keyof BookDraft, 'status'>, value: string): void => {
    setDraft((current) => ({ ...current, [field]: value }));
    setNotice(null);
  };

  // A save refused as stale shows its conflict below the form instead of a notice.
  const settleSave = async (saving: Promise<boolean>): Promise<void> => {
    try {
      setNotice((await rebaseOnSave(saving)) ? { text: 'Saved.', alert: false } : null);
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : SAVE_FAILURE, alert: true });
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (draft.title.trim() === '') {
      setNotice({ text: 'Give the book a title.', alert: true });
      return;
    }
    const changes = bookChanges(base, draft);
    if (Object.keys(changes).length === 0) {
      setNotice({ text: 'Nothing to save.', alert: false });
      return;
    }
    void settleSave(update.save(base, changes));
  };

  const settleRemove = async (removing: Promise<boolean>): Promise<void> => {
    try {
      const removed = await removing;
      setConfirmingDelete(false);
      if (removed) {
        router.push(BOOK_PATH);
      }
    } catch (error) {
      setConfirmingDelete(false);
      setNotice({ text: error instanceof Error ? error.message : REMOVE_FAILURE, alert: true });
    }
  };

  return (
    <div className='grid gap-4'>
      <form className='grid gap-3' onSubmit={submit}>
        <div className='grid gap-1'>
          <Label htmlFor={ids.title}>Title</Label>
          <Input
            id={ids.title}
            value={draft.title}
            maxLength={MAX_TITLE_LENGTH}
            required
            onChange={(event) => edit('title', event.target.value)}
          />
        </div>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='grid gap-1'>
            <Label htmlFor={ids.author}>Author</Label>
            <Input id={ids.author} value={draft.author} onChange={(event) => edit('author', event.target.value)} />
          </div>
          <div className='grid gap-1'>
            <Label htmlFor={ids.genre}>Genre</Label>
            <Input id={ids.genre} value={draft.genre} onChange={(event) => edit('genre', event.target.value)} />
          </div>
          <div className='grid gap-1'>
            <Label htmlFor={ids.language}>Language</Label>
            <Input id={ids.language} value={draft.language} onChange={(event) => edit('language', event.target.value)} />
          </div>
          <div className='grid gap-1'>
            <Label htmlFor={ids.status}>Status</Label>
            <select
              id={ids.status}
              className='rounded-md border bg-background px-3 py-2 text-sm'
              value={draft.status}
              onChange={(event) => {
                const { value } = event.target;
                if (isStatus(value)) {
                  setDraft((current) => ({ ...current, status: value }));
                  setNotice(null);
                }
              }}
            >
              {BOOK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.description}>Description</Label>
          <Textarea
            id={ids.description}
            value={draft.description}
            onChange={(event) => edit('description', event.target.value)}
          />
        </div>
        <div>
          <Button type='submit'>Save</Button>
        </div>
      </form>
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={CONFLICT_FIELDS}
          onResolve={(merged) => {
            void settleSave(update.resolve(merged));
          }}
          onDiscard={update.discard}
        />
      )}
      {notice !== null && (
        <p role={notice.alert ? 'alert' : 'status'} className={notice.alert ? 'text-sm text-destructive' : 'text-sm'}>
          {notice.text}
        </p>
      )}
      <div className='flex flex-wrap items-center gap-3 border-t pt-4 text-sm'>
        <span className='text-muted-foreground'>Download:</span>
        {EXPORT_FORMATS.map((format) => (
          <a key={format} href={exportUrl(client, book.id, format)} download className='underline'>
            {formatLabel(format)}
          </a>
        ))}
      </div>
      <div className='flex flex-wrap items-center gap-2 border-t pt-4'>
        {confirmingDelete ? (
          <>
            <Button
              variant='destructive'
              onClick={() => {
                void settleRemove(remove.save(book, {}));
              }}
            >
              Yes, delete {book.title}
            </Button>
            <Button variant='ghost' onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant='outline' onClick={() => setConfirmingDelete(true)}>
            Delete this book
          </Button>
        )}
      </div>
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Delete anyway'
          onResolve={(merged) => {
            void settleRemove(remove.resolve(merged));
          }}
          onDiscard={remove.discard}
        />
      )}
    </div>
  );
}
