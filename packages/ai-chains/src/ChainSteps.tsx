// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { abilityName, useAbilities } from '@zephyrex/ai-agents';
import { usePrompts } from '@zephyrex/ai-prompts';
import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, type SyntheticEvent, useState } from 'react';
import { type ConflictField, ConflictPanel, useClient, useDraft, useEditBase, writeProblem } from 'zephyrex';
import { addStep, type ChainStep, useChainStepActions, useChainSteps } from './chainsApi';
import { stepArguments, stepSummary } from './runDisplay';
import { StepFieldset } from './StepFieldset';
import { draftOfStep, NEW_STEP, nextPosition, type StepDraft, stepChanges, stepFields, stepProblem } from './stepModel';

const UNSEEN = 'one you can no longer see';
const SAVE_FAILURE = 'The step could not be saved.';

const CONFLICT_FIELDS: readonly ConflictField<ChainStep>[] = [
  { key: 'name', label: 'Name' },
  { key: 'kind', label: 'What it does' },
  { key: 'expression', label: 'Expression' },
  { key: 'variable', label: 'Variable' },
  { key: 'position', label: 'Position', format: ({ position }) => String(position ?? '') },
];

/** How steps name the prompts and abilities they call. */
function useStepNames(): { prompt: (id: string) => string; ability: (id: string) => string } {
  const { data: prompts = [] } = usePrompts();
  const { data: abilities = [] } = useAbilities();
  return {
    prompt: (id) => prompts.find((prompt) => prompt.id === id)?.name ?? UNSEEN,
    ability: (id) => {
      const found = abilities.find((ability) => ability.id === id);
      return found === undefined ? UNSEEN : abilityName(found);
    },
  };
}

/** One step: what it does, and editing it (saved over it as loaded) or deleting it. */
function StepRow({ step, names }: { step: ChainStep; names: ReturnType<typeof useStepNames> }): ReactElement {
  const { update, remove } = useChainStepActions(step.chain_id);
  const { base, rebaseOnSave } = useEditBase(step);
  const [draft, setDraft] = useDraft(base, draftOfStep);
  const [editing, setEditing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const args = stepArguments(step);

  const settle = async (writing: Promise<boolean>): Promise<void> => {
    try {
      if (await rebaseOnSave(writing)) {
        setEditing(false);
      }
    } catch (error) {
      setProblem(error instanceof Error ? error.message : SAVE_FAILURE);
    }
  };
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const wrong = stepProblem(draft);
    if (wrong !== null) {
      setProblem(wrong);
      return;
    }
    const changes = stepChanges(base, draft);
    if (Object.keys(changes).length === 0) {
      setEditing(false);
      return;
    }
    setProblem(null);
    void settle(update.save(base, changes));
  };

  return (
    <li className='grid gap-2 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div className='grid gap-0.5'>
          <span>
            <code>{step.name}</code> · {stepSummary(step, names)}
          </span>
          {args !== '' && <code className='text-xs text-muted-foreground'>{args}</code>}
        </div>
        <div className='flex gap-2'>
          <Button type='button' size='sm' variant='outline' aria-expanded={editing} onClick={() => setEditing(!editing)}>
            {editing ? 'Close' : 'Edit'}
          </Button>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => {
              setProblem(null);
              void writeProblem(remove.save(step, {}), 'The step could not be deleted.').then(setProblem);
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      {editing && (
        <form aria-label={`Step ${step.name}`} className='grid gap-3' noValidate onSubmit={submit}>
          <StepFieldset draft={draft} onChange={setDraft} />
          <div>
            <Button type='submit' size='sm'>
              Save step
            </Button>
          </div>
        </form>
      )}
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
          applyLabel='Delete anyway'
          onResolve={(merged) => {
            void writeProblem(remove.resolve(merged), 'The step could not be deleted.').then(setProblem);
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

/** Add a step, after the last unless placed elsewhere. */
function NewStepForm({ chainId, steps }: { chainId: string; steps: readonly ChainStep[] }): ReactElement {
  const client = useClient();
  const { mutate: refreshSteps } = useChainSteps(chainId);
  const [draft, setDraft] = useState<StepDraft | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const shown = draft ?? { ...NEW_STEP, position: String(nextPosition(steps)) };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const wrong = stepProblem(shown);
    if (wrong !== null) {
      setProblem(wrong);
      return;
    }
    const adding = (async (): Promise<void> => {
      await addStep(client, chainId, stepFields(shown));
      await refreshSteps();
      setDraft(null);
    })();
    void writeProblem(adding, 'The step could not be added.').then(setProblem);
  };

  return (
    <form aria-label='New step' className='grid gap-3 rounded-md border p-4' noValidate onSubmit={submit}>
      <StepFieldset
        draft={shown}
        onChange={(changed) => {
          setDraft(changed);
          setProblem(null);
        }}
      />
      <div>
        <Button type='submit'>Add step</Button>
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** The chain's steps in the order they run, and adding another. */
export function ChainSteps({ chainId }: { chainId: string }): ReactElement {
  const { data: steps = [], error, isLoading } = useChainSteps(chainId);
  const names = useStepNames();
  return (
    <div className='grid gap-4'>
      {error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The steps could not be loaded: {error.message}
        </p>
      )}
      {error === undefined && steps.length === 0 && (
        <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'No steps yet: a run of it does nothing.'}</p>
      )}
      {steps.length > 0 && (
        <ol aria-label='Steps' className='divide-y rounded-md border'>
          {steps.map((step) => (
            <StepRow key={step.id} step={step} names={names} />
          ))}
        </ol>
      )}
      <NewStepForm chainId={chainId} steps={steps} />
    </div>
  );
}
