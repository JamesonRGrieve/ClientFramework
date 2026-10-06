// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type ConflictField, ConflictPanel, useClient, useDraft, useEditBase, writeProblem } from 'zephyrex';
import { Textarea } from 'zephyrex/ui/textarea';
import {
  addShortTermMemory,
  type ShortTermMemory as Entry,
  useShortTermMemories,
  useShortTermMemoryActions,
} from './agentsApi';

const CONTENT_ROWS = 2;
const SAVE_FAILURE = 'The memory could not be saved.';

const CONFLICT_FIELDS: readonly ConflictField<Entry>[] = [{ key: 'content', label: 'Content' }];

const contentOf = ({ content }: Entry): string => content;

/** One working memory: its content, saved over it as loaded; or forgetting it. */
function EntryRow({ entry }: { entry: Entry }): ReactElement {
  const id = useId();
  const { update, remove } = useShortTermMemoryActions(entry.agent_id);
  const { base, rebaseOnSave } = useEditBase(entry);
  const [content, setContent] = useDraft(base, contentOf);
  const [problem, setProblem] = useState<string | null>(null);

  const settle = async (writing: Promise<boolean>): Promise<void> => {
    try {
      await rebaseOnSave(writing);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : SAVE_FAILURE);
    }
  };
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (content === base.content) {
      return;
    }
    setProblem(null);
    void settle(update.save(base, { content }));
  };

  return (
    <li className='grid gap-2 px-4 py-3 text-sm'>
      <form aria-label={`Memory ${entry.key}`} className='grid gap-2' noValidate onSubmit={submit}>
        <Label htmlFor={id}>
          <code>{entry.key}</code>
        </Label>
        <Textarea id={id} rows={CONTENT_ROWS} value={content} onChange={(event) => setContent(event.target.value)} />
        <div className='flex gap-2'>
          <Button type='submit' size='sm'>
            Save
          </Button>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => {
              setProblem(null);
              void settle(remove.save(entry, {}));
            }}
          >
            Forget
          </Button>
        </div>
      </form>
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={CONFLICT_FIELDS}
          onResolve={(merged) => {
            void settle(update.resolve(merged));
          }}
          onDiscard={update.discard}
        />
      )}
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Forget anyway'
          onResolve={(merged) => {
            void settle(remove.resolve(merged));
          }}
          onDiscard={remove.discard}
        />
      )}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** Add a working memory under a key; a key the agent already has is changed rather than doubled. */
function NewEntryForm({ agentId }: { agentId: string }): ReactElement {
  const client = useClient();
  const ids = { key: useId(), content: useId() };
  const { data: entries = [], mutate: refreshEntries } = useShortTermMemories(agentId);
  const [key, setKey] = useState('');
  const [content, setContent] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (key.trim() === '' || content.trim() === '') {
      setProblem('Give the memory a key and some content.');
      return;
    }
    if (entries.some((entry) => entry.key === key.trim())) {
      setProblem(`The agent already remembers ${key.trim()}: change it above.`);
      return;
    }
    const adding = (async (): Promise<void> => {
      await addShortTermMemory(client, agentId, key.trim(), content.trim());
      await refreshEntries();
      setKey('');
      setContent('');
    })();
    void writeProblem(adding, 'The memory could not be added.').then(setProblem);
  };

  return (
    <form aria-label='New working memory' className='grid gap-2' noValidate onSubmit={submit}>
      <div className='grid gap-1'>
        <Label htmlFor={ids.key}>Key</Label>
        <Input id={ids.key} value={key} onChange={(event) => setKey(event.target.value)} />
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.content}>Content</Label>
        <Textarea
          id={ids.content}
          rows={CONTENT_ROWS}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </div>
      <div>
        <Button type='submit'>Add</Button>
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** The agent's working memory: what goes into every one of its turns. */
export function ShortTermMemory({ agentId }: { agentId: string }): ReactElement {
  const { data: entries = [], error, isLoading } = useShortTermMemories(agentId);
  return (
    <div className='grid gap-4'>
      {error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The working memory could not be loaded: {error.message}
        </p>
      )}
      {error === undefined && entries.length === 0 && (
        <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'Nothing in working memory.'}</p>
      )}
      {entries.length > 0 && (
        <ul aria-label='Working memory' className='divide-y rounded-md border'>
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
      <NewEntryForm agentId={agentId} />
    </div>
  );
}
