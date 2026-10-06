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
import { createAgent, useAgents } from './agentsApi';
import { RotationPicker } from './RotationPicker';
import { agentPagePath } from './routes';

/** Make an agent, then on to its page to give it abilities, context and triggers. */
function NewAgentForm(): ReactElement {
  const client = useClient();
  const router = useRouter();
  const { mutate: refreshAgents } = useAgents();
  const nameId = useId();
  const [name, setName] = useState('');
  const [rotationId, setRotationId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (name.trim() === '') {
      setProblem('Give the agent a name.');
      return;
    }
    setPending(true);
    const creating = (async (): Promise<void> => {
      const agent = await createAgent(client, { name: name.trim(), rotation_id: rotationId });
      await refreshAgents();
      router.push(agentPagePath(agent.id));
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(creating, 'The agent could not be made.'));
      setPending(false);
    })();
  };

  return (
    <form
      aria-label='New agent'
      className='grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end'
      noValidate
      onSubmit={submit}
    >
      <div className='grid gap-1'>
        <Label htmlFor={nameId}>Name</Label>
        <Input id={nameId} value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <RotationPicker value={rotationId} onChange={setRotationId} />
      <Button type='submit' disabled={pending}>
        Make agent
      </Button>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive sm:col-span-3'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** The user's agents, favourites first, each opening its page; and a form to make one. */
export function AgentsPage(): ReactElement {
  const { data: agents = [], error, isLoading } = useAgents();

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>
            Agents that take turns on your behalf: when asked, on a schedule, or when something happens.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6'>
          <NewAgentForm />
          {error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The agents could not be loaded: {error.message}
            </p>
          )}
          {error === undefined && agents.length === 0 && (
            <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'You have no agents yet.'}</p>
          )}
          {agents.length > 0 && (
            <ul aria-label='Agents' className='divide-y rounded-md border'>
              {agents.map((agent) => (
                <li key={agent.id} className='px-4 py-3 text-sm'>
                  {agent.favourite && (
                    <>
                      <span aria-hidden='true'>★ </span>
                      <span className='sr-only'>Favourite: </span>
                    </>
                  )}
                  <Link href={agentPagePath(agent.id)} className='font-medium hover:underline'>
                    {agent.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
