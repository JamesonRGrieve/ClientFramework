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
import { createChain, useChains } from './chainsApi';
import { chainPagePath } from './routes';

/** Make a chain, then on to its page to give it steps. */
function NewChainForm(): ReactElement {
  const client = useClient();
  const router = useRouter();
  const { mutate: refreshChains } = useChains();
  const ids = { name: useId(), description: useId() };
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (name.trim() === '') {
      setProblem('Give the chain a name.');
      return;
    }
    setPending(true);
    const creating = (async (): Promise<void> => {
      const chain = await createChain(client, {
        name: name.trim(),
        description: description.trim() === '' ? null : description.trim(),
      });
      await refreshChains();
      router.push(chainPagePath(chain.id));
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(creating, 'The chain could not be made.'));
      setPending(false);
    })();
  };

  return (
    <form
      aria-label='New chain'
      className='grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end'
      noValidate
      onSubmit={submit}
    >
      <div className='grid gap-1'>
        <Label htmlFor={ids.name}>Name</Label>
        <Input id={ids.name} value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.description}>Description (optional)</Label>
        <Input id={ids.description} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <Button type='submit' disabled={pending}>
        Make chain
      </Button>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive sm:col-span-3'>
          {problem}
        </p>
      )}
    </form>
  );
}

/** The user's chains, favourites first, each opening its page; and a form to make one. */
export function ChainsPage(): ReactElement {
  const { data: chains = [], error, isLoading } = useChains();
  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <Card>
        <CardHeader>
          <CardTitle>Chains</CardTitle>
          <CardDescription>Steps that run in order: prompts, abilities, conditions and variables.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6'>
          <NewChainForm />
          {error !== undefined && (
            <p role='alert' className='text-sm text-destructive'>
              The chains could not be loaded: {error.message}
            </p>
          )}
          {error === undefined && chains.length === 0 && (
            <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'You have no chains yet.'}</p>
          )}
          {chains.length > 0 && (
            <ul aria-label='Chains' className='divide-y rounded-md border'>
              {chains.map((chain) => (
                <li key={chain.id} className='grid gap-0.5 px-4 py-3 text-sm'>
                  <span>
                    {chain.favourite && (
                      <>
                        <span aria-hidden='true'>★ </span>
                        <span className='sr-only'>Favourite: </span>
                      </>
                    )}
                    <Link href={chainPagePath(chain.id)} className='font-medium hover:underline'>
                      {chain.name}
                    </Link>
                  </span>
                  {(chain.description ?? '') !== '' && <span className='text-muted-foreground'>{chain.description}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
