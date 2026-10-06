// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { AgentMemories } from '@zephyrex/ai-memories';
import Link from 'next/link.js';
import type { ReactElement, ReactNode } from 'react';
import { useClient } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { AgentAbilities } from './AgentAbilities';
import { AgentConversations } from './AgentConversations';
import { AgentDetails } from './AgentDetails';
import { linkContextPrompt, useAgent, useAgentContextPromptActions, useAgentContextPrompts } from './agentsApi';
import { PromptLinks } from './PromptLinks';
import { AGENTS_PATH } from './routes';
import { ShortTermMemory } from './ShortTermMemory';
import { TakeTurn } from './TakeTurn';
import { Triggers } from './Triggers';
import { Turns } from './Turns';

/** A titled card on the agent's page. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description !== undefined && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** The prompts put into each of the agent's turns. */
function AgentContext({ agentId }: { agentId: string }): ReactElement {
  const client = useClient();
  const { data: links = [], mutate } = useAgentContextPrompts(agentId);
  const { remove } = useAgentContextPromptActions(agentId);
  return (
    <PromptLinks
      links={links}
      unlink={remove}
      link={async (promptId) => {
        await linkContextPrompt(client, agentId, promptId);
        await mutate();
      }}
    />
  );
}

/** One agent: running it, what it did, what fires it, what it may use, what it knows, and where it talks. */
export function AgentPage({ params }: { params: Record<string, string> }): ReactElement {
  const agentId = params['agentId'] ?? '';
  const { data: agent, error, isLoading } = useAgent(agentId);

  if (error !== undefined) {
    return (
      <p role='alert' className='p-4 text-sm text-destructive'>
        The agent could not be loaded: {error.message}
      </p>
    );
  }
  if (agent === undefined || agent === null) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>
        {isLoading ? 'Loading…' : 'This agent does not exist or is not yours to see.'}{' '}
        <Link href={AGENTS_PATH} className='underline'>
          Back to your agents
        </Link>
      </p>
    );
  }

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='grid gap-1'>
        <Link href={AGENTS_PATH} className='text-sm text-muted-foreground underline'>
          Agents
        </Link>
        <h1 className='text-3xl font-semibold'>{agent.name}</h1>
      </div>
      <Section title='Run it'>
        <TakeTurn agentId={agent.id} />
      </Section>
      <Section title='Turns' description='What it was asked, how it went, and what it did.'>
        <Turns agentId={agent.id} />
      </Section>
      <Section title='Triggers' description='What makes it take a turn by itself.'>
        <Triggers agentId={agent.id} />
      </Section>
      <Section title='Abilities' description='It may use only what is ticked here.'>
        <AgentAbilities agentId={agent.id} />
      </Section>
      <Section title='Context' description='Prompts put into every one of its turns, in this order.'>
        <AgentContext agentId={agent.id} />
      </Section>
      <Section title='Working memory' description='Kept short and put into every turn.'>
        <ShortTermMemory agentId={agent.id} />
      </Section>
      <Section title='Long-term memory' description='Kept for good and recalled when related.'>
        <AgentMemories agentId={agent.id} />
      </Section>
      <Section title='Conversations'>
        <AgentConversations agentId={agent.id} />
      </Section>
      <Section title='Details'>
        <AgentDetails key={agent.id} agent={agent} />
      </Section>
    </main>
  );
}
