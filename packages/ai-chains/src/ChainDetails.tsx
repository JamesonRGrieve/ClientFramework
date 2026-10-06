// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type ConflictField, ConflictPanel, useDraft, useEditBase } from 'zephyrex';
import { type Chain, MAX_MAX_OUTPUT_CHARACTERS, MAX_MAX_STEPS, MAX_TIMEOUT_SECONDS, useChainActions } from './chainsApi';
import { CHAINS_PATH } from './routes';

const SAVE_FAILURE = 'The chain could not be saved.';
const REMOVE_FAILURE = 'The chain could not be deleted.';

/** A chain's bounds: what each is called, and the most it may be raised to. */
const BOUNDS = [
  { key: 'maxSteps', field: 'max_steps', label: 'Most steps a run executes', ceiling: MAX_MAX_STEPS },
  { key: 'timeoutSeconds', field: 'timeout_seconds', label: 'Seconds a run may take', ceiling: MAX_TIMEOUT_SECONDS },
  {
    key: 'maxOutputCharacters',
    field: 'max_output_characters',
    label: 'Largest output of one step (characters)',
    ceiling: MAX_MAX_OUTPUT_CHARACTERS,
  },
] as const;

const CONFLICT_FIELDS: readonly ConflictField<Chain>[] = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'favourite', label: 'Favourite', format: ({ favourite }) => (favourite === true ? 'Yes' : 'No') },
  ...BOUNDS.map(({ field, label }) => ({
    key: field,
    label,
    format: (chain: Partial<Chain>) => String(chain[field] ?? ''),
  })),
];

interface ChainDraft {
  name: string;
  description: string;
  favourite: boolean;
  maxSteps: string;
  timeoutSeconds: string;
  maxOutputCharacters: string;
}

const draftOf = (chain: Chain): ChainDraft => ({
  name: chain.name,
  description: chain.description ?? '',
  favourite: chain.favourite,
  maxSteps: String(chain.max_steps),
  timeoutSeconds: String(chain.timeout_seconds),
  maxOutputCharacters: String(chain.max_output_characters),
});

/** Why the server would refuse `draft`, or null. */
export function chainProblem(draft: ChainDraft): string | null {
  if (draft.name.trim() === '') {
    return 'A chain needs a name.';
  }
  const wrong = BOUNDS.find(({ key, ceiling }) => {
    const value = Number(draft[key]);
    return !(Number.isInteger(value) && value >= 1 && value <= ceiling);
  });
  return wrong === undefined ? null : `${wrong.label} is a whole number from 1 to ${String(wrong.ceiling)}.`;
}

/** Only what the user changed, so a save never rewrites what someone else changed. */
export function chainChanges(chain: Chain, draft: ChainDraft): Partial<Chain> {
  const description = draft.description.trim() === '' ? null : draft.description.trim();
  const bound = (key: (typeof BOUNDS)[number]['key'], current: number): number | undefined =>
    Number(draft[key]) === current ? undefined : Number(draft[key]);
  const maxSteps = bound('maxSteps', chain.max_steps);
  const timeoutSeconds = bound('timeoutSeconds', chain.timeout_seconds);
  const maxOutput = bound('maxOutputCharacters', chain.max_output_characters);
  return {
    ...(draft.name.trim() === chain.name ? {} : { name: draft.name.trim() }),
    ...(description === (chain.description ?? null) ? {} : { description }),
    ...(draft.favourite === chain.favourite ? {} : { favourite: draft.favourite }),
    ...(maxSteps === undefined ? {} : { max_steps: maxSteps }),
    ...(timeoutSeconds === undefined ? {} : { timeout_seconds: timeoutSeconds }),
    ...(maxOutput === undefined ? {} : { max_output_characters: maxOutput }),
  };
}

/** A labelled bound, a whole number up to its ceiling. */
function BoundField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className='grid gap-1'>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type='number' value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

/** A chain's name, description, favourite and bounds, saved over it as loaded; or deleting it. */
export function ChainDetails({ chain }: { chain: Chain }): ReactElement {
  const router = useRouter();
  const ids = { name: useId(), description: useId(), favourite: useId() };
  const { update, remove } = useChainActions(chain.id);
  const { base, rebaseOnSave } = useEditBase(chain);
  const [draft, setDraft] = useDraft(base, draftOf);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);
  const edit = <K extends keyof ChainDraft>(field: K, value: ChainDraft[K]): void => {
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
        router.push(CHAINS_PATH);
      }
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : REMOVE_FAILURE, alert: true });
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const wrong = chainProblem(draft);
    if (wrong !== null) {
      setNotice({ text: wrong, alert: true });
      return;
    }
    const changes = chainChanges(base, draft);
    if (Object.keys(changes).length === 0) {
      setNotice({ text: 'Nothing to save.', alert: false });
      return;
    }
    void settleSave(update.save(base, changes));
  };

  // The conflict panels sit beside the form, not in it: their choices are not the form's fields.
  return (
    <div className='grid gap-3'>
      <form aria-label='Chain details' className='grid gap-3' noValidate onSubmit={submit}>
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
        {BOUNDS.map(({ key, label }) => (
          <BoundField key={key} label={label} value={draft[key]} onChange={(value) => edit(key, value)} />
        ))}
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
          <Button type='submit'>Save chain</Button>
          <Button
            type='button'
            variant='outline'
            className='ml-auto'
            onClick={() => {
              setNotice(null);
              void settleRemove(remove.save(chain, {}));
            }}
          >
            Delete chain
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
