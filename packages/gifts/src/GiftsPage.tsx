// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Input } from 'zephyrex/ui/input';
import { giftsApi, useGifts, useShopLink } from './giftsApi';
import { type Gift, type GiftIdea, type GiftPerson, STATUSES, statusLabel } from './giftsModel';

const SELECT = 'h-9 rounded-md border bg-background px-3 text-sm font-normal';
const LINK = 'underline underline-offset-4';
const SOMEONE_ELSE = '';

function Problem({ problem }: { problem: string | null }): ReactNode {
  return problem === null ? null : (
    <p role='alert' className='text-sm text-destructive'>
      {problem}
    </p>
  );
}

/** A link to search the shop for `query`, once the server has made it. */
function ShopSearch({ query }: { query: string }): ReactNode {
  const [asked, setAsked] = useState(false);
  const link = useShopLink(asked ? query : null);
  if (!asked) {
    return (
      <Button
        type='button'
        size='sm'
        variant='ghost'
        className='justify-self-start'
        onClick={() => setAsked(true)}
        aria-label={`Find ${query} at the shop`}
      >
        Find it at the shop
      </Button>
    );
  }
  if (link.data === undefined) {
    return (
      <span className='text-sm text-muted-foreground'>{link.error === undefined ? 'Finding…' : link.error.message}</span>
    );
  }
  return (
    <a className={`${LINK} text-sm`} href={link.data} target='_blank' rel='noopener noreferrer sponsored'>
      Search the shop for {query}
    </a>
  );
}

function AddGift({ people, onAdded }: { people: readonly GiftPerson[]; onAdded: () => Promise<unknown> }): ReactNode {
  const client = useClient();
  const ids = { who: useId(), name: useId(), title: useId(), url: useId(), note: useId() };
  // Until someone is chosen, the first person the app knows (they may arrive after the first render).
  const [chosen, setChosen] = useState<string | null>(null);
  const who = chosen ?? people.at(0)?.ref ?? SOMEONE_ELSE;
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const person = people.find((candidate) => candidate.ref === who);
  const forName = person?.name ?? name.trim();
  const save = (event: SyntheticEvent): void => {
    event.preventDefault();
    void (async (): Promise<void> => {
      const failed = await writeProblem(
        giftsApi.add(client, {
          for_name: forName,
          for_ref: person?.ref ?? null,
          title: title.trim(),
          url: url.trim() === '' ? null : url.trim(),
          note: note.trim() === '' ? null : note.trim(),
        }),
        'The gift could not be saved.',
      );
      setProblem(failed);
      if (failed === null) {
        setTitle('');
        setUrl('');
        setNote('');
        await onAdded();
      }
    })();
  };
  return (
    <form onSubmit={save} aria-label='Add a gift' className='grid gap-3 sm:grid-cols-2'>
      <label htmlFor={ids.who} className='grid gap-1 text-sm font-medium'>
        For
        <select id={ids.who} value={who} onChange={(event) => setChosen(event.target.value)} className={SELECT}>
          {people.map((candidate) => (
            <option key={candidate.ref} value={candidate.ref}>
              {candidate.name}
            </option>
          ))}
          <option value={SOMEONE_ELSE}>Someone else…</option>
        </select>
      </label>
      {person === undefined ? (
        <label htmlFor={ids.name} className='grid gap-1 text-sm font-medium'>
          Their name
          <Input id={ids.name} value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required />
        </label>
      ) : (
        <span aria-hidden='true' />
      )}
      <label htmlFor={ids.title} className='grid gap-1 text-sm font-medium'>
        Gift
        <Input id={ids.title} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required />
      </label>
      <label htmlFor={ids.url} className='grid gap-1 text-sm font-medium'>
        Link (optional)
        <Input
          id={ids.url}
          type='url'
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder='https://…'
          maxLength={2000}
        />
      </label>
      <label htmlFor={ids.note} className='grid gap-1 text-sm font-medium sm:col-span-2'>
        Note (optional)
        <Input
          id={ids.note}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder='Size, colour, the occasion'
          maxLength={2000}
        />
      </label>
      <div className='grid gap-2 sm:col-span-2'>
        <Problem problem={problem} />
        <Button type='submit' className='justify-self-start' disabled={title.trim() === '' || forName === ''}>
          Add the gift
        </Button>
      </div>
    </form>
  );
}

function GiftRow({ gift, onChanged }: { gift: Gift; onChanged: () => Promise<unknown> }): ReactNode {
  const client = useClient();
  const statusId = useId();
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = (write: Promise<unknown>, fallback: string): void => {
    setBusy(true);
    void (async (): Promise<void> => {
      setProblem(await writeProblem(write, fallback));
      await onChanged();
      setBusy(false);
    })();
  };
  const link = gift.url ?? null;
  return (
    <li className='grid gap-1 py-3'>
      <div className='flex flex-wrap items-center gap-3'>
        <span className={gift.status === 'given' ? 'font-medium text-muted-foreground line-through' : 'font-medium'}>
          {gift.title}
        </span>
        <label htmlFor={statusId} className='sr-only'>
          {`Where ${gift.title} is`}
        </label>
        <select
          id={statusId}
          value={gift.status}
          disabled={busy}
          onChange={(event) => {
            const status = STATUSES.find((candidate) => candidate === event.target.value);
            if (status !== undefined) {
              run(giftsApi.setStatus(client, gift, status), 'That could not be saved.');
            }
          }}
          className='h-8 rounded-md border bg-background px-2 text-sm'
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          disabled={busy}
          aria-label={`Delete ${gift.title}`}
          onClick={() => run(giftsApi.remove(client, gift), 'The gift could not be deleted.')}
        >
          Delete
        </Button>
      </div>
      {gift.note !== null && gift.note !== undefined && <span className='text-sm text-muted-foreground'>{gift.note}</span>}
      {link === null ? (
        <ShopSearch query={gift.title} />
      ) : (
        <a className={`${LINK} text-sm`} href={link} target='_blank' rel='noopener noreferrer sponsored'>
          Where to buy it
        </a>
      )}
      <Problem problem={problem} />
    </li>
  );
}

function Ideas({ ideas, onSaved }: { ideas: readonly GiftIdea[]; onSaved: () => Promise<unknown> }): ReactNode {
  const client = useClient();
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState<readonly string[]>([]);
  const keyOf = (idea: GiftIdea): string => `${idea.forRef}|${idea.title}`;
  const save = (idea: GiftIdea): void => {
    void (async (): Promise<void> => {
      const failed = await writeProblem(
        giftsApi.add(client, {
          for_name: idea.forName,
          for_ref: idea.forRef,
          title: idea.title,
          url: null,
          note: idea.note ?? null,
        }),
        'The idea could not be saved.',
      );
      setProblem(failed);
      if (failed === null) {
        setSaved((current) => [...current, keyOf(idea)]);
        await onSaved();
      }
    })();
  };
  return (
    <div className='grid gap-2'>
      <Problem problem={problem} />
      <ul aria-label='Ideas' className='divide-y'>
        {ideas.map((idea) => (
          <li key={keyOf(idea)} className='flex flex-wrap items-center gap-3 py-2'>
            <span className='grid flex-1'>
              <span className='font-medium'>{idea.title}</span>
              <span className='text-sm text-muted-foreground'>
                For {idea.forName}
                {idea.note === undefined ? '' : ` · ${idea.note}`}
              </span>
            </span>
            {saved.includes(keyOf(idea)) ? (
              <span className='text-sm text-muted-foreground'>Saved</span>
            ) : (
              <Button type='button' size='sm' variant='outline' onClick={() => save(idea)} aria-label={`Save ${idea.title}`}>
                Save
              </Button>
            )}
            <ShopSearch query={idea.title} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface GiftsPageProps {
  /** The people the app knows, to choose who a gift is for. */
  people?: readonly GiftPerson[];
  /** Suggestions the app draws from what it knows about them. */
  ideas?: readonly GiftIdea[];
}

/** A private list of gifts for the people in your life, with links to the shop. */
export function GiftsPage({ people = [], ideas = [] }: GiftsPageProps): ReactNode {
  const gifts = useGifts();
  const refresh = async (): Promise<unknown> => gifts.mutate();
  const byPerson = new Map<string, Gift[]>();
  for (const gift of gifts.data ?? []) {
    byPerson.set(gift.for_name, [...(byPerson.get(gift.for_name) ?? []), gift]);
  }
  return (
    <div className='grid gap-6'>
      <div className='grid gap-1'>
        <h1 className='text-3xl font-semibold'>Gifts</h1>
        <p className='text-muted-foreground'>Ideas for the people in your life. Only you ever see this list.</p>
      </div>
      {ideas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ideas</CardTitle>
            <CardDescription>From what they share with you: their sizes and favourites.</CardDescription>
          </CardHeader>
          <CardContent>
            <Ideas ideas={ideas} onSaved={refresh} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Your gift list</CardTitle>
          <CardDescription>What you mean to give, and whether you have bought or given it yet.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6'>
          <AddGift people={people} onAdded={refresh} />
          {gifts.error !== undefined && <Problem problem={gifts.error.message} />}
          {gifts.data?.length === 0 && <p className='text-sm text-muted-foreground'>No gifts yet.</p>}
          {[...byPerson.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, theirs]) => (
              <section key={name} aria-label={`For ${name}`} className='grid gap-1'>
                <h2 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>For {name}</h2>
                <ul className='divide-y'>
                  {theirs.map((gift) => (
                    <GiftRow key={gift.id} gift={gift} onChanged={refresh} />
                  ))}
                </ul>
              </section>
            ))}
        </CardContent>
      </Card>
      <p className='text-xs text-muted-foreground'>
        As an Amazon Associate, the people who run this app earn from qualifying purchases made through its links.
      </p>
    </div>
  );
}
