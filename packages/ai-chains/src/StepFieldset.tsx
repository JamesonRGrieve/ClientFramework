// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { abilityName, useAbilities } from '@zephyrex/ai-agents';
import { usePrompts } from '@zephyrex/ai-prompts';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, useId } from 'react';
import { Textarea } from 'zephyrex/ui/textarea';
import { STEP_KINDS, type StepKind } from './chainsApi';
import { END, type StepDraft } from './stepModel';

const ARGUMENT_ROWS = 3;
const NONE = '';

const KIND_LABELS: Readonly<Record<StepKind, string>> = {
  prompt: 'Ask a prompt',
  ability: 'Use an ability',
  condition: 'Check a condition',
  set: 'Set a variable',
};

const SELECT_CLASS = 'rounded-md border bg-background px-2 py-2 text-sm';

/** A labelled text input, with a hint under it when given. */
function TextField({
  label,
  value,
  onChange,
  hint,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  type?: 'text' | 'number';
}): ReactElement {
  const id = useId();
  return (
    <div className='grid gap-1'>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint !== undefined && <p className='text-xs text-muted-foreground'>{hint}</p>}
    </div>
  );
}

/** A labelled choice of `options`, with none chosen offered as `placeholder`. */
function Choice({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  placeholder: string;
  onChange: (value: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className='grid gap-1'>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={SELECT_CLASS} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value={NONE}>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * A step's fields, showing only those its kind uses: the prompt or ability it calls and the arguments
 * it fills, a condition's test and jumps, a set step's value, and the variable its output goes to.
 */
export function StepFieldset({ draft, onChange }: { draft: StepDraft; onChange: (draft: StepDraft) => void }): ReactElement {
  const ids = { kind: useId(), arguments: useId() };
  const { data: prompts = [] } = usePrompts();
  const { data: abilities = [] } = useAbilities();
  const set = <K extends keyof StepDraft>(field: K, value: StepDraft[K]): void => onChange({ ...draft, [field]: value });
  const takesArguments = draft.kind === 'prompt' || draft.kind === 'ability';

  return (
    <fieldset className='grid gap-3'>
      <legend className='sr-only'>The step</legend>
      <TextField
        label='Step name'
        value={draft.name}
        onChange={(name) => set('name', name)}
        hint='A letter, then letters, digits or _.'
      />
      <div className='grid gap-1'>
        <Label htmlFor={ids.kind}>What it does</Label>
        <select
          id={ids.kind}
          className={SELECT_CLASS}
          value={draft.kind}
          onChange={(event) => {
            const kind = STEP_KINDS.find((option) => option === event.target.value);
            if (kind !== undefined) {
              set('kind', kind);
            }
          }}
        >
          {STEP_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>
      {draft.kind === 'prompt' && (
        <Choice
          label='Prompt'
          value={draft.promptId}
          placeholder='Choose a prompt…'
          options={prompts.map((prompt) => ({ value: prompt.id, label: prompt.name ?? 'Untitled prompt' }))}
          onChange={(promptId) => set('promptId', promptId)}
        />
      )}
      {draft.kind === 'ability' && (
        <Choice
          label='Ability'
          value={draft.abilityId}
          placeholder='Choose an ability…'
          options={abilities.map((ability) => ({ value: ability.id, label: abilityName(ability) }))}
          onChange={(abilityId) => set('abilityId', abilityId)}
        />
      )}
      {takesArguments && (
        <div className='grid gap-1'>
          <Label htmlFor={ids.arguments}>{draft.kind === 'prompt' ? 'Fill its variables' : 'Arguments'} (optional)</Label>
          <Textarea
            id={ids.arguments}
            rows={ARGUMENT_ROWS}
            className='font-mono'
            value={draft.arguments}
            onChange={(event) => set('arguments', event.target.value)}
          />
          <p className='text-xs text-muted-foreground'>
            One name = expression per line, the expression over the run’s variables.
          </p>
        </div>
      )}
      {(draft.kind === 'condition' || draft.kind === 'set') && (
        <TextField
          label={draft.kind === 'condition' ? 'Test' : 'Value'}
          value={draft.expression}
          onChange={(expression) => set('expression', expression)}
          hint='An expression over the run’s variables.'
        />
      )}
      {draft.kind === 'condition' ? (
        <>
          <TextField
            label='When true, go to (optional)'
            value={draft.onTrue}
            onChange={(onTrue) => set('onTrue', onTrue)}
            hint={`A step’s name, or “${END}” to stop; blank for the next step.`}
          />
          <TextField
            label='When false, go to (optional)'
            value={draft.onFalse}
            onChange={(onFalse) => set('onFalse', onFalse)}
          />
          <TextField
            label='Most times it jumps back (optional)'
            type='number'
            value={draft.maxLoops}
            onChange={(maxLoops) => set('maxLoops', maxLoops)}
          />
        </>
      ) : (
        <TextField
          label={draft.kind === 'set' ? 'Variable' : 'Output into (optional)'}
          value={draft.variable}
          onChange={(variable) => set('variable', variable)}
        />
      )}
      <TextField
        label='Position'
        type='number'
        value={draft.position}
        onChange={(position) => set('position', position)}
        hint='Steps run lowest first.'
      />
    </fieldset>
  );
}
