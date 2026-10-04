// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type ConflictField, ConflictPanel, useClient, useDraft, useEditBase, writeProblem } from 'zephyrex';
import { Textarea } from 'zephyrex/ui/textarea';
import { type Chapter, createChapter, MAX_TITLE_LENGTH, useChapterActions, useChapters } from './bookApi';

const SAVE_FAILURE = 'The chapter could not be saved.';
const REMOVE_FAILURE = 'The chapter could not be deleted.';
const CONTENT_ROWS = 16;

const CONFLICT_FIELDS: readonly ConflictField<Chapter>[] = [
  { key: 'title', label: 'Title' },
  { key: 'content', label: 'Text' },
];

/** The editor's values, as typed. */
interface ChapterDraft {
  title: string;
  content: string;
}

const draftOf = ({ title, content }: Chapter): ChapterDraft => ({ title, content });

const words = (count: number): string => (count === 1 ? '1 word' : `${String(count)} words`);

/** Only what the user changed in a chapter, so a save never rewrites what someone else changed. */
export function chapterChanges(chapter: Chapter, title: string, content: string): Partial<Chapter> {
  const changes: Partial<Chapter> = {};
  if (title.trim() !== chapter.title) {
    changes.title = title.trim();
  }
  if (content !== chapter.content) {
    changes.content = content;
  }
  return changes;
}

/** Edit one chapter's title and text, saved over the chapter as loaded; or delete it. */
function ChapterEditor({ chapter, onClose }: { chapter: Chapter; onClose: () => void }): ReactElement {
  const ids = { title: useId(), content: useId() };
  const { update, remove } = useChapterActions(chapter.book_id);
  // The editor edits, and saves over, the chapter it was opened on until the user's save lands.
  const { base, rebaseOnSave } = useEditBase(chapter);
  const [draft, setDraft] = useDraft(base, draftOf);
  const { title, content } = draft;
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);
  const edit = (field: keyof ChapterDraft, value: string): void => {
    setDraft((current) => ({ ...current, [field]: value }));
    setNotice(null);
  };

  const settleSave = async (saving: Promise<boolean>): Promise<void> => {
    try {
      setNotice((await rebaseOnSave(saving)) ? { text: 'Saved.', alert: false } : null);
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : SAVE_FAILURE, alert: true });
    }
  };

  const settleRemove = async (removing: Promise<boolean>): Promise<void> => {
    try {
      if (await removing) {
        onClose();
      }
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : REMOVE_FAILURE, alert: true });
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (title.trim() === '') {
      setNotice({ text: 'Give the chapter a title.', alert: true });
      return;
    }
    const changes = chapterChanges(base, title, content);
    if (Object.keys(changes).length === 0) {
      setNotice({ text: 'Nothing to save.', alert: false });
      return;
    }
    void settleSave(update.save(base, changes));
  };

  return (
    <section aria-label={`Chapter ${String(chapter.position)}`} className='grid gap-3 rounded-md border p-4'>
      <form className='grid gap-3' onSubmit={submit}>
        <div className='grid gap-1'>
          <Label htmlFor={ids.title}>Chapter title</Label>
          <Input
            id={ids.title}
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            required
            onChange={(event) => edit('title', event.target.value)}
          />
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.content}>Text (Markdown)</Label>
          <Textarea
            id={ids.content}
            rows={CONTENT_ROWS}
            value={content}
            onChange={(event) => edit('content', event.target.value)}
          />
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button type='submit'>Save chapter</Button>
          <Button type='button' variant='ghost' onClick={onClose}>
            Close
          </Button>
          <Button
            type='button'
            variant='outline'
            className='ml-auto'
            onClick={() => {
              void settleRemove(remove.save(chapter, {}));
            }}
          >
            Delete chapter
          </Button>
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
      {notice !== null && (
        <p role={notice.alert ? 'alert' : 'status'} className={notice.alert ? 'text-sm text-destructive' : 'text-sm'}>
          {notice.text}
        </p>
      )}
    </section>
  );
}

/** Add a chapter at the end of the book. */
function NewChapterForm({ bookId, after }: { bookId: string; after: number }): ReactElement {
  const client = useClient();
  const titleId = useId();
  const { mutate: refreshChapters } = useChapters(bookId);
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (title.trim() === '') {
      setProblem('Give the chapter a title.');
      return;
    }
    const adding = (async (): Promise<void> => {
      await createChapter(client, bookId, title.trim(), after + 1);
      await refreshChapters();
      setTitle('');
    })();
    void writeProblem(adding, 'The chapter could not be added.').then(setProblem);
  };

  return (
    <form className='flex flex-wrap items-end gap-2' onSubmit={submit}>
      <div className='grid flex-1 gap-1'>
        <Label htmlFor={titleId}>New chapter</Label>
        <Input
          id={titleId}
          value={title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(event) => {
            setTitle(event.target.value);
            setProblem(null);
          }}
        />
      </div>
      <Button type='submit'>Add chapter</Button>
      {problem !== null && (
        <p role='alert' className='w-full text-sm text-destructive'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** A book's chapters in order, with their word counts; one at a time open to edit. */
export function Chapters({ bookId }: { bookId: string }): ReactElement {
  const chapters = useChapters(bookId);
  const [openId, setOpenId] = useState<string | null>(null);
  const all = chapters.data ?? [];
  const open = all.find((chapter) => chapter.id === openId);
  const last = all.at(-1)?.position ?? 0;

  return (
    <div className='grid gap-4'>
      {chapters.error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The chapters could not be loaded: {chapters.error.message}
        </p>
      )}
      {chapters.error === undefined && all.length === 0 && (
        <p className='text-sm text-muted-foreground'>{chapters.isLoading ? 'Loading…' : 'No chapters yet.'}</p>
      )}
      {all.length > 0 && (
        <ol aria-label='Chapters' className='divide-y rounded-md border'>
          {all.map((chapter) => (
            <li key={chapter.id} className='flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm'>
              <button
                type='button'
                className='text-left font-medium hover:underline'
                aria-expanded={chapter.id === openId}
                onClick={() => setOpenId(chapter.id === openId ? null : chapter.id)}
              >
                {chapter.position}. {chapter.title}
              </button>
              <span className='text-muted-foreground'>{words(chapter.word_count)}</span>
            </li>
          ))}
        </ol>
      )}
      {open !== undefined && <ChapterEditor key={open.id} chapter={open} onClose={() => setOpenId(null)} />}
      <NewChapterForm bookId={bookId} after={last} />
    </div>
  );
}
