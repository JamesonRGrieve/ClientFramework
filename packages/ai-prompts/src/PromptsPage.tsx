// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Textarea } from 'zephyrex/ui/textarea';
import { MAX_PROMPT_CHARACTERS, variablesIn } from './promptModel';
import { createPrompt, usePrompts } from './promptsApi';
import { promptPagePath } from './routes';

const CONTENT_ROWS = 6;

/** Store a prompt, then on to its page to give its variables defaults and try it. */
function NewPromptForm(): ReactElement {
  const client = useClient();
  const router = useRouter();
  const { mutate: refreshPrompts } = usePrompts();
  const ids = { name: useId(), description: useId(), content: useId() };
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (name.trim() === '' || content.trim() === '') {
      setProblem('Give the prompt a name and some text.');
      return;
    }
    setPending(true);
    const creating = (async (): Promise<void> => {
      const prompt = await createPrompt(client, {
        name: name.trim(),
        description: description.trim() === '' ? null : description.trim(),
        content,
      });
      await refreshPrompts();
      router.push(promptPagePath(prompt.id));
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(creating, 'The prompt could not be stored.'));
      setPending(false);
    })();
  };

  return (
    <form aria-label='New prompt' className='grid gap-3' noValidate onSubmit={submit}>
      <div className='grid gap-1'>
        <Label htmlFor={ids.name}>Name</Label>
        <Input id={ids.name} value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.description}>Description (optional)</Label>
        <Input id={ids.description} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.content}>Prompt</Label>
        <Textarea
          id={ids.content}
          rows={CONTENT_ROWS}
          maxLength={MAX_PROMPT_CHARACTERS}
          value={content}
          placeholder='Summarise {TOPIC} for {AUDIENCE}.'
          onChange={(event) => setContent(event.target.value)}
        />
        <p className='text-xs text-muted-foreground'>Mark each variable {'{LIKE_THIS}'}: capitals, digits and _.</p>
      </div>
      <div>
        <Button type='submit' disabled={pending}>
          Store prompt
        </Button>
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** The user's prompts, favourites first, each opening its page; and a form to store one. */
export function PromptsPage(): ReactElement {
  const { data: prompts = [], error, isLoading } = usePrompts();

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <Card>
        <CardHeader>
          <CardTitle>Prompts</CardTitle>
          <CardDescription>Stored prompts, their variables filled when they are used.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6'>
          {error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The prompts could not be loaded: {error.message}
            </p>
          )}
          {error === undefined && prompts.length === 0 && (
            <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'You have no prompts yet.'}</p>
          )}
          {prompts.length > 0 && (
            <ul aria-label='Prompts' className='divide-y rounded-md border'>
              {prompts.map((prompt) => (
                <li key={prompt.id} className='grid gap-1 px-4 py-3 text-sm'>
                  <span>
                    {prompt.favourite && (
                      <>
                        <span aria-hidden='true'>★ </span>
                        <span className='sr-only'>Favourite: </span>
                      </>
                    )}
                    <Link href={promptPagePath(prompt.id)} className='font-medium hover:underline'>
                      {(prompt.name ?? '') === '' ? 'Untitled prompt' : prompt.name}
                    </Link>
                  </span>
                  {(prompt.description ?? '') !== '' && <span className='text-muted-foreground'>{prompt.description}</span>}
                  <span className='text-xs text-muted-foreground'>
                    {variablesIn(prompt.content).length === 0
                      ? 'No variables'
                      : `Variables: ${variablesIn(prompt.content).join(', ')}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Store a prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <NewPromptForm />
        </CardContent>
      </Card>
    </main>
  );
}
