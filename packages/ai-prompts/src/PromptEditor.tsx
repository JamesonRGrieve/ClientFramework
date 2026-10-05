// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type ConflictField, ConflictPanel, useDraft, useEditBase } from 'zephyrex';
import { Textarea } from 'zephyrex/ui/textarea';
import { MAX_PROMPT_CHARACTERS } from './promptModel';
import { type Prompt, usePromptActions } from './promptsApi';
import { PROMPTS_PATH } from './routes';

const CONTENT_ROWS = 10;
const SAVE_FAILURE = 'The prompt could not be saved.';
const REMOVE_FAILURE = 'The prompt could not be deleted.';

const CONFLICT_FIELDS: readonly ConflictField<Prompt>[] = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'favourite', label: 'Favourite', format: ({ favourite }) => (favourite === true ? 'Yes' : 'No') },
  { key: 'content', label: 'Prompt' },
];

interface PromptDraft {
  name: string;
  description: string;
  favourite: boolean;
  content: string;
}

const draftOf = ({ name, description, favourite, content }: Prompt): PromptDraft => ({
  name: name ?? '',
  description: description ?? '',
  favourite,
  content,
});

/** Only what the user changed, so a save never rewrites what someone else changed. */
export function promptChanges(prompt: Prompt, draft: PromptDraft): Partial<Prompt> {
  const changes: Partial<Prompt> = {};
  if (draft.name.trim() !== (prompt.name ?? '')) {
    changes.name = draft.name.trim();
  }
  const description = draft.description.trim() === '' ? null : draft.description.trim();
  if (description !== (prompt.description ?? null)) {
    changes.description = description;
  }
  if (draft.favourite !== prompt.favourite) {
    changes.favourite = draft.favourite;
  }
  if (draft.content !== prompt.content) {
    changes.content = draft.content;
  }
  return changes;
}

/** Change a prompt, saved over it as it was loaded; or delete it. */
export function PromptEditor({ prompt }: { prompt: Prompt }): ReactElement {
  const router = useRouter();
  const ids = { name: useId(), description: useId(), favourite: useId(), content: useId() };
  const { update, remove } = usePromptActions(prompt.id);
  const { base, rebaseOnSave } = useEditBase(prompt);
  const [draft, setDraft] = useDraft(base, draftOf);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);
  const edit = <K extends keyof PromptDraft>(field: K, value: PromptDraft[K]): void => {
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
        router.push(PROMPTS_PATH);
      }
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : REMOVE_FAILURE, alert: true });
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (draft.name.trim() === '' || draft.content.trim() === '') {
      setNotice({ text: 'A prompt needs a name and some text.', alert: true });
      return;
    }
    const changes = promptChanges(base, draft);
    if (Object.keys(changes).length === 0) {
      setNotice({ text: 'Nothing to save.', alert: false });
      return;
    }
    void settleSave(update.save(base, changes));
  };

  // The conflict panels sit beside the form, not in it: their choices are not the form's fields.
  return (
    <div className='grid gap-3'>
      <form aria-label='Prompt details' className='grid gap-3' noValidate onSubmit={submit}>
        <div className='grid gap-1'>
          <Label htmlFor={ids.name}>Name</Label>
          <Input id={ids.name} value={draft.name} onChange={(event) => edit('name', event.target.value)} />
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.description}>Description</Label>
          <Input
            id={ids.description}
            value={draft.description}
            onChange={(event) => edit('description', event.target.value)}
          />
        </div>
        <div className='flex items-center gap-2'>
          <input
            id={ids.favourite}
            type='checkbox'
            checked={draft.favourite}
            onChange={(event) => edit('favourite', event.target.checked)}
          />
          <Label htmlFor={ids.favourite}>Favourite</Label>
        </div>
        <div className='grid gap-1'>
          <Label htmlFor={ids.content}>Prompt</Label>
          <Textarea
            id={ids.content}
            rows={CONTENT_ROWS}
            maxLength={MAX_PROMPT_CHARACTERS}
            value={draft.content}
            onChange={(event) => edit('content', event.target.value)}
          />
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button type='submit'>Save prompt</Button>
          <Button
            type='button'
            variant='outline'
            className='ml-auto'
            onClick={() => {
              setNotice(null);
              void settleRemove(remove.save(prompt, {}));
            }}
          >
            Delete prompt
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
    </div>
  );
}
