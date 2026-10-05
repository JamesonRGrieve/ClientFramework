// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type ConflictField, ConflictPanel, useDraft, useEditBase } from 'zephyrex';
import { type Conversation, useConversationActions } from './conversationsApi';
import { Problem } from './Problem';
import { CONVERSATIONS_PATH } from './routes';

const SAVE_FAILURE = 'The chat could not be saved.';
const REMOVE_FAILURE = 'The conversation could not be deleted.';

const CONFLICT_FIELDS: readonly ConflictField<Conversation>[] = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
];

interface DetailsDraft {
  name: string;
  description: string;
}

const draftOf = ({ name, description }: Conversation): DetailsDraft => ({
  name: name ?? '',
  description: description ?? '',
});

/** Only what the user changed, so a save never rewrites what someone else changed. */
export function detailsChanges(conversation: Conversation, draft: DetailsDraft): Partial<Conversation> {
  const changes: Partial<Conversation> = {};
  if (draft.name.trim() !== (conversation.name ?? '')) {
    changes.name = draft.name.trim();
  }
  const description = draft.description.trim() === '' ? null : draft.description.trim();
  if (description !== (conversation.description ?? null)) {
    changes.description = description;
  }
  return changes;
}

/**
 * A group chat's name and description, which anyone in it may change, saved over the chat as it was
 * loaded; and, for its owner, deleting the conversation.
 */
export function ConversationDetails({
  conversation,
  viewerOwns,
}: {
  conversation: Conversation;
  viewerOwns: boolean;
}): ReactElement {
  const router = useRouter();
  const ids = { name: useId(), description: useId() };
  const { update, remove } = useConversationActions(conversation.id);
  const { base, rebaseOnSave } = useEditBase(conversation);
  const [draft, setDraft] = useDraft(base, draftOf);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);
  const edit = (field: keyof DetailsDraft, value: string): void => {
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
        router.push(CONVERSATIONS_PATH);
      }
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : REMOVE_FAILURE, alert: true });
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (draft.name.trim() === '') {
      setNotice({ text: 'Give the chat a name.', alert: true });
      return;
    }
    const changes = detailsChanges(base, draft);
    if (Object.keys(changes).length === 0) {
      setNotice({ text: 'Nothing to save.', alert: false });
      return;
    }
    void settleSave(update.save(base, changes));
  };

  return (
    <div className='grid gap-3'>
      {conversation.is_group_chat && (
        <form aria-label='Chat details' className='grid gap-3' onSubmit={submit}>
          <div className='grid gap-1'>
            <Label htmlFor={ids.name}>Name</Label>
            <Input id={ids.name} value={draft.name} required onChange={(event) => edit('name', event.target.value)} />
          </div>
          <div className='grid gap-1'>
            <Label htmlFor={ids.description}>Description</Label>
            <Input
              id={ids.description}
              value={draft.description}
              onChange={(event) => edit('description', event.target.value)}
            />
          </div>
          <div>
            <Button type='submit'>Save details</Button>
          </div>
        </form>
      )}
      {viewerOwns && (
        <div>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              setNotice(null);
              void settleRemove(remove.save(conversation, {}));
            }}
          >
            Delete conversation
          </Button>
        </div>
      )}
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
      {notice !== null &&
        (notice.alert ? (
          <Problem text={notice.text} />
        ) : (
          <p role='status' className='text-sm'>
            {notice.text}
          </p>
        ))}
    </div>
  );
}
