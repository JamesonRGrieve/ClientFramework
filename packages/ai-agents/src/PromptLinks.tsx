// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { usePrompts } from '@zephyrex/ai-prompts';
import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type Conflict, ConflictPanel, type GuardedSave, type Versioned, writeProblem } from 'zephyrex';

const NONE = '';

/** A link to a prompt: an agent's or a project's. */
interface PromptLink extends Versioned {
  id: string;
  prompt_id: string;
}

/**
 * Prompts whose text goes into the context of every turn (an agent's) or conversation (a project's),
 * in the order linked: each by name, unlinking it guarded by the link as loaded, and linking another.
 */
export function PromptLinks<T extends PromptLink>({
  links,
  link,
  unlink,
}: {
  links: readonly T[];
  link: (promptId: string) => Promise<void>;
  unlink: GuardedSave<T>;
}): ReactElement {
  const id = useId();
  const { data: prompts = [] } = usePrompts();
  const [chosen, setChosen] = useState(NONE);
  const [problem, setProblem] = useState<string | null>(null);
  const linked = new Set(links.map(({ prompt_id: promptId }) => promptId));
  const nameOf = (promptId: string): string =>
    prompts.find((prompt) => prompt.id === promptId)?.name ?? 'A prompt you can no longer see';

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (chosen === NONE) {
      setProblem('Choose a prompt.');
      return;
    }
    const linking = (async (): Promise<void> => {
      await link(chosen);
      setChosen(NONE);
    })();
    void writeProblem(linking, 'The prompt could not be linked.').then(setProblem);
  };
  const settle = (unlinking: Promise<boolean>): void => {
    void writeProblem(unlinking, 'The prompt could not be unlinked.').then(setProblem);
  };
  const conflict: Conflict<T> | null = unlink.conflict;

  return (
    <div className='grid gap-3'>
      {links.length === 0 ? (
        <p className='text-sm text-muted-foreground'>No context prompts.</p>
      ) : (
        <ol aria-label='Context prompts' className='divide-y rounded-md border'>
          {links.map((row) => (
            <li key={row.id} className='flex items-center justify-between gap-2 px-4 py-2 text-sm'>
              <span>{nameOf(row.prompt_id)}</span>
              <Button type='button' size='sm' variant='ghost' onClick={() => settle(unlink.save(row, {}))}>
                Unlink
              </Button>
            </li>
          ))}
        </ol>
      )}
      {conflict !== null && (
        <ConflictPanel
          conflict={conflict}
          fields={[]}
          applyLabel='Unlink anyway'
          onResolve={(merged) => settle(unlink.resolve(merged))}
          onDiscard={unlink.discard}
        />
      )}
      <form aria-label='Link a prompt' className='flex flex-wrap items-end gap-2' noValidate onSubmit={submit}>
        <div className='grid flex-1 gap-1'>
          <Label htmlFor={id}>Add a prompt</Label>
          <select
            id={id}
            className='rounded-md border bg-background px-2 py-2 text-sm'
            value={chosen}
            onChange={(event) => setChosen(event.target.value)}
          >
            <option value={NONE}>Choose a prompt…</option>
            {prompts
              .filter((prompt) => !linked.has(prompt.id))
              .map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name ?? 'Untitled prompt'}
                </option>
              ))}
          </select>
        </div>
        <Button type='submit'>Link</Button>
      </form>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}
