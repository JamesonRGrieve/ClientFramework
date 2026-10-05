// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import type { ReactElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { PromptArguments } from './PromptArguments';
import { PromptEditor } from './PromptEditor';
import { usePrompt } from './promptsApi';
import { PROMPTS_PATH } from './routes';
import { TryPrompt } from './TryPrompt';

/** One prompt: its text, its arguments' defaults, and trying it. */
export function PromptPage({ params }: { params: Record<string, string> }): ReactElement {
  const promptId = params['promptId'] ?? '';
  const { data: prompt, error, isLoading } = usePrompt(promptId);

  if (error !== undefined) {
    return (
      <p role='alert' className='p-4 text-sm text-destructive'>
        The prompt could not be loaded: {error.message}
      </p>
    );
  }
  if (prompt === undefined || prompt === null) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>
        {isLoading ? 'Loading…' : 'This prompt does not exist or is not yours to see.'}{' '}
        <Link href={PROMPTS_PATH} className='underline'>
          Back to your prompts
        </Link>
      </p>
    );
  }

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='grid gap-1'>
        <Link href={PROMPTS_PATH} className='text-sm text-muted-foreground underline'>
          Prompts
        </Link>
        <h1 className='text-3xl font-semibold'>{(prompt.name ?? '') === '' ? 'Untitled prompt' : prompt.name}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <PromptEditor key={prompt.id} prompt={prompt} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Arguments</CardTitle>
          <CardDescription>Each variable&apos;s default; a variable with none must be given a value.</CardDescription>
        </CardHeader>
        <CardContent>
          <PromptArguments prompt={prompt} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Try it</CardTitle>
        </CardHeader>
        <CardContent>
          <TryPrompt key={prompt.id} prompt={prompt} />
        </CardContent>
      </Card>
    </main>
  );
}
