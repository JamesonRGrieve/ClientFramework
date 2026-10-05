// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type ConflictField, ConflictPanel, useClient, useDraft, useEditBase, writeProblem } from 'zephyrex';
import { variablesIn, variablesWithoutArguments } from './promptModel';
import { type Argument, createArgument, type Prompt, useArgumentActions, useArguments } from './promptsApi';

const SAVE_FAILURE = 'The default could not be saved.';

const CONFLICT_FIELDS: readonly ConflictField<Argument>[] = [
  { key: 'default_value', label: 'Default', format: ({ default_value: value }) => value ?? '(required)' },
];

const defaultOf = ({ default_value: value }: Argument): string => value ?? '';

/** A default as stored: blank is none, which makes the variable required. */
export const storedDefault = (text: string): string | null => (text === '' ? null : text);

/** One argument: its default (blank: required), saved over it as loaded; or deleted. */
function ArgumentRow({ argument, used }: { argument: Argument; used: boolean }): ReactElement {
  const id = useId();
  const { update, remove } = useArgumentActions(argument.prompt_id);
  const { base, rebaseOnSave } = useEditBase(argument);
  const [value, setValue] = useDraft(base, defaultOf);
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
    if (storedDefault(value) === (base.default_value ?? null)) {
      return;
    }
    setProblem(null);
    void settle(update.save(base, { default_value: storedDefault(value) }));
  };

  return (
    <li className='grid gap-2 px-4 py-3 text-sm'>
      <form
        aria-label={`Argument ${argument.name ?? ''}`}
        className='flex flex-wrap items-end gap-2'
        noValidate
        onSubmit={submit}
      >
        <div className='grid flex-1 gap-1'>
          <Label htmlFor={id}>
            <code>{argument.name}</code> default
            {!used && <span className='text-muted-foreground'> (not in the prompt)</span>}
          </Label>
          <Input id={id} value={value} placeholder='(required)' onChange={(event) => setValue(event.target.value)} />
        </div>
        <Button type='submit' size='sm'>
          Save
        </Button>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          onClick={() => {
            setProblem(null);
            void settle(remove.save(argument, {}));
          }}
        >
          Delete
        </Button>
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

/**
 * A prompt's arguments: each variable's default (none makes it required). A variable the prompt
 * uses without an argument can be given one in a click; an argument the prompt no longer uses is
 * marked.
 */
export function PromptArguments({ prompt }: { prompt: Prompt }): ReactElement {
  const client = useClient();
  const { data: args = [], error, isLoading, mutate: refreshArguments } = useArguments(prompt.id);
  const [problem, setProblem] = useState<string | null>(null);
  const used = variablesIn(prompt.content);
  const missing = variablesWithoutArguments(
    prompt.content,
    args.map(({ name }) => name ?? ''),
  );

  const add = (name: string): void => {
    setProblem(null);
    const adding = (async (): Promise<void> => {
      await createArgument(client, prompt.id, name, null);
      await refreshArguments();
    })();
    void writeProblem(adding, `${name} could not be added.`).then(setProblem);
  };

  return (
    <div className='grid gap-4'>
      {error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The arguments could not be loaded: {error.message}
        </p>
      )}
      {error === undefined && args.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          {isLoading ? 'Loading…' : 'No arguments: every variable is required.'}
        </p>
      )}
      {args.length > 0 && (
        <ul aria-label='Arguments' className='divide-y rounded-md border'>
          {args.map((argument) => (
            <ArgumentRow key={argument.id} argument={argument} used={used.includes(argument.name ?? '')} />
          ))}
        </ul>
      )}
      {missing.length > 0 && (
        <fieldset className='grid gap-2'>
          <legend className='text-sm'>Variables without an argument (required until given a default):</legend>
          <div className='flex flex-wrap gap-2'>
            {missing.map((name) => (
              <Button key={name} type='button' size='sm' variant='outline' onClick={() => add(name)}>
                Add {name}
              </Button>
            ))}
          </div>
        </fieldset>
      )}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}
