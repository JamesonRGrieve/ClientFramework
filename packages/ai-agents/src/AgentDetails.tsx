// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type ConflictField, ConflictPanel, useDraft, useEditBase } from 'zephyrex';
import { type Agent, useAgentActions } from './agentsApi';
import { RotationPicker } from './RotationPicker';
import { AGENTS_PATH } from './routes';

const SAVE_FAILURE = 'The agent could not be saved.';
const REMOVE_FAILURE = 'The agent could not be deleted.';

const CONFLICT_FIELDS: readonly ConflictField<Agent>[] = [
  { key: 'name', label: 'Name' },
  { key: 'favourite', label: 'Favourite', format: ({ favourite }) => (favourite === true ? 'Yes' : 'No') },
  { key: 'rotation_id', label: 'Thinks with', format: ({ rotation_id: id }) => id ?? 'The default models' },
  { key: 'image_url', label: 'Image' },
];

interface AgentDraft {
  name: string;
  favourite: boolean;
  rotationId: string | null;
  imageUrl: string;
}

const draftOf = ({ name, favourite, rotation_id: rotation, image_url: image }: Agent): AgentDraft => ({
  name,
  favourite,
  rotationId: rotation ?? null,
  imageUrl: image ?? '',
});

/** Only what the user changed, so a save never rewrites what someone else changed. */
export function agentChanges(agent: Agent, draft: AgentDraft): Partial<Agent> {
  const changes: Partial<Agent> = {};
  if (draft.name.trim() !== agent.name) {
    changes.name = draft.name.trim();
  }
  if (draft.favourite !== agent.favourite) {
    changes.favourite = draft.favourite;
  }
  if (draft.rotationId !== (agent.rotation_id ?? null)) {
    changes.rotation_id = draft.rotationId;
  }
  const image = draft.imageUrl.trim() === '' ? null : draft.imageUrl.trim();
  if (image !== (agent.image_url ?? null)) {
    changes.image_url = image;
  }
  return changes;
}

/** An agent's name, favourite, models and image, saved over it as loaded; or deleting it. */
export function AgentDetails({ agent }: { agent: Agent }): ReactElement {
  const router = useRouter();
  const ids = { name: useId(), favourite: useId(), image: useId() };
  const { update, remove } = useAgentActions(agent.id);
  const { base, rebaseOnSave } = useEditBase(agent);
  const [draft, setDraft] = useDraft(base, draftOf);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);
  const edit = <K extends keyof AgentDraft>(field: K, value: AgentDraft[K]): void => {
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
        router.push(AGENTS_PATH);
      }
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : REMOVE_FAILURE, alert: true });
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (draft.name.trim() === '') {
      setNotice({ text: 'An agent needs a name.', alert: true });
      return;
    }
    const changes = agentChanges(base, draft);
    if (Object.keys(changes).length === 0) {
      setNotice({ text: 'Nothing to save.', alert: false });
      return;
    }
    void settleSave(update.save(base, changes));
  };

  // The conflict panels sit beside the form, not in it: their choices are not the form's fields.
  return (
    <div className='grid gap-3'>
      <form aria-label='Agent details' className='grid gap-3' noValidate onSubmit={submit}>
        <div className='grid gap-1'>
          <Label htmlFor={ids.name}>Name</Label>
          <Input id={ids.name} value={draft.name} onChange={(event) => edit('name', event.target.value)} />
        </div>
        <RotationPicker value={draft.rotationId} onChange={(rotationId) => edit('rotationId', rotationId)} />
        <div className='grid gap-1'>
          <Label htmlFor={ids.image}>Image URL (optional)</Label>
          <Input id={ids.image} value={draft.imageUrl} onChange={(event) => edit('imageUrl', event.target.value)} />
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
        <div className='flex flex-wrap gap-2'>
          <Button type='submit'>Save agent</Button>
          <Button
            type='button'
            variant='outline'
            className='ml-auto'
            onClick={() => {
              setNotice(null);
              void settleRemove(remove.save(agent, {}));
            }}
          >
            Delete agent
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
