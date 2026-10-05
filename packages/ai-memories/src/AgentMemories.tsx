// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { ConflictPanel, serverInstant, useClient, writeProblem } from 'zephyrex';
import { Textarea } from 'zephyrex/ui/textarea';
import { MAX_MEMORY_CHARACTERS, type Memory, recall, remember, useMemories, useMemoryActions } from './memoriesApi';

const CONTENT_ROWS = 3;
/** How many memories a recall asks for. */
const RECALL_LIMIT = 5;
const REMOVE_FAILURE = 'The memory could not be deleted.';

const shownTime = (value: string | null | undefined): string =>
  value === null || value === undefined || value === '' ? '' : serverInstant(value).toLocaleString();

/** How a memory was kept, in words: its source, when, and whether it is recalled by meaning. */
export const memoryDetails = ({ source, created_at: created, embedding_model: embeddingModel }: Memory): string =>
  [
    `from ${source}`,
    shownTime(created),
    embeddingModel === null || embeddingModel === undefined || embeddingModel === ''
      ? 'recalled by its words'
      : `embedded by ${embeddingModel}`,
  ]
    .filter((part) => part !== '')
    .join(' · ');

/** One memory, and deleting it (guarded by it as loaded). */
function MemoryItem({ memory }: { memory: Memory }): ReactElement {
  const { remove } = useMemoryActions(memory.agent_id);
  const [problem, setProblem] = useState<string | null>(null);
  const settle = async (removing: Promise<boolean>): Promise<void> => {
    try {
      await removing;
    } catch (error) {
      setProblem(error instanceof Error ? error.message : REMOVE_FAILURE);
    }
  };
  return (
    <li className='grid gap-1 px-4 py-3 text-sm'>
      {(memory.key ?? '') !== '' && <span className='font-medium'>{memory.key}</span>}
      <p className='whitespace-pre-wrap break-words'>{memory.content}</p>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-xs text-muted-foreground'>{memoryDetails(memory)}</span>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          onClick={() => {
            setProblem(null);
            void settle(remove.save(memory, {}));
          }}
        >
          Delete
        </Button>
      </div>
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Delete anyway'
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

/** Keep something for the agent, with an optional label. */
function RememberForm({ agentId }: { agentId: string }): ReactElement {
  const client = useClient();
  const ids = { key: useId(), content: useId() };
  const { mutate: refreshMemories } = useMemories(agentId);
  const [key, setKey] = useState('');
  const [content, setContent] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (content.trim() === '') {
      setProblem('Write what to remember.');
      return;
    }
    const keeping = (async (): Promise<void> => {
      await remember(client, { agentId, content: content.trim(), key: key.trim() === '' ? null : key.trim() });
      await refreshMemories();
      setKey('');
      setContent('');
    })();
    void writeProblem(keeping, 'The memory could not be kept.').then(setProblem);
  };

  return (
    <form aria-label='Keep a memory' className='grid gap-2' noValidate onSubmit={submit}>
      <div className='grid gap-1'>
        <Label htmlFor={ids.key}>Label (optional)</Label>
        <Input id={ids.key} value={key} onChange={(event) => setKey(event.target.value)} />
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.content}>Remember</Label>
        <Textarea
          id={ids.content}
          rows={CONTENT_ROWS}
          maxLength={MAX_MEMORY_CHARACTERS}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setProblem(null);
          }}
        />
      </div>
      <div>
        <Button type='submit'>Keep it</Button>
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** Ask what the agent remembers about something: the memories most related, by meaning or words. */
function RecallForm({ agentId }: { agentId: string }): ReactElement {
  const client = useClient();
  const id = useId();
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Memory[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const recalling = (async (): Promise<void> => {
      setFound(await recall(client, agentId, query, RECALL_LIMIT));
    })();
    void writeProblem(recalling, 'Nothing could be recalled.').then(setProblem);
  };

  return (
    <div className='grid gap-2'>
      <form aria-label='Recall memories' className='flex flex-wrap items-end gap-2' noValidate onSubmit={submit}>
        <div className='grid flex-1 gap-1'>
          <Label htmlFor={id}>Recall</Label>
          <Input
            id={id}
            value={query}
            placeholder='What do you remember about…'
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button type='submit' variant='outline'>
          Recall
        </Button>
      </form>
      {found !== null && (
        <ul aria-label='Recalled' className='grid gap-1 text-sm'>
          {found.length === 0 && <li className='text-muted-foreground'>Nothing related.</li>}
          {found.map((memory) => (
            <li key={memory.id} className='rounded border px-3 py-2'>
              {(memory.key ?? '') !== '' && <span className='font-medium'>{memory.key}: </span>}
              {memory.content}
            </li>
          ))}
        </ul>
      )}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}

/** What an agent keeps for the long term: its memories, keeping one, and recalling by a question. */
export function AgentMemories({ agentId }: { agentId: string }): ReactElement {
  const { data: memories = [], error, isLoading } = useMemories(agentId);
  return (
    <div className='grid gap-4'>
      <RecallForm agentId={agentId} />
      {error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The memories could not be loaded: {error.message}
        </p>
      )}
      {error === undefined && memories.length === 0 && (
        <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'Nothing remembered yet.'}</p>
      )}
      {memories.length > 0 && (
        <ul aria-label='Memories' className='divide-y rounded-md border'>
          {memories.map((memory) => (
            <MemoryItem key={memory.id} memory={memory} />
          ))}
        </ul>
      )}
      <RememberForm agentId={agentId} />
    </div>
  );
}
