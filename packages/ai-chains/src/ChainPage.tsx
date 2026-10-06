// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import type { ReactElement, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { ChainDetails } from './ChainDetails';
import { ChainRuns } from './ChainRuns';
import { useChain } from './chainsApi';
import { ChainSteps } from './ChainSteps';
import { CHAINS_PATH } from './routes';
import { RunChain } from './RunChain';

/** A titled card on the chain's page. */
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

/** One chain: running it, its steps, what its runs did, and its details and bounds. */
export function ChainPage({ params }: { params: Record<string, string> }): ReactElement {
  const chainId = params['chainId'] ?? '';
  const { data: chain, error, isLoading } = useChain(chainId);

  if (error !== undefined) {
    return (
      <p role='alert' className='p-4 text-sm text-destructive'>
        The chain could not be loaded: {error.message}
      </p>
    );
  }
  if (chain === undefined || chain === null) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>
        {isLoading ? 'Loading…' : 'This chain does not exist or is not yours to see.'}{' '}
        <Link href={CHAINS_PATH} className='underline'>
          Back to your chains
        </Link>
      </p>
    );
  }

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='grid gap-1'>
        <Link href={CHAINS_PATH} className='text-sm text-muted-foreground underline'>
          Chains
        </Link>
        <h1 className='text-3xl font-semibold'>{chain.name}</h1>
        {(chain.description ?? '') !== '' && <p className='text-muted-foreground'>{chain.description}</p>}
      </div>
      <Section title='Run it' description='It runs as you, within its bounds.'>
        <RunChain chainId={chain.id} />
      </Section>
      <Section title='Steps' description='Run lowest position first; a condition may jump.'>
        <ChainSteps chainId={chain.id} />
      </Section>
      <Section title='Runs' description='How each run went, and the steps it executed.'>
        <ChainRuns chainId={chain.id} />
      </Section>
      <Section title='Details'>
        <ChainDetails key={chain.id} chain={chain} />
      </Section>
    </main>
  );
}
