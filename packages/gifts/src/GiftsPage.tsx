// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { chipGroup } from 'zephyrex/hooks/chipKeys';
import { rowList } from 'zephyrex/hooks/rowKeys';
import { type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useClient, writeProblem } from 'zephyrex';
import { deferWithUndo, notify } from 'zephyrex/hooks/useToast';
import { LoadProblem } from 'zephyrex/ui/load-problem';
import { Button } from 'zephyrex/ui/button';
import { InlineText } from 'zephyrex/ui/inline-text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'zephyrex/ui/dialog';
import { Input } from 'zephyrex/ui/input';
import { Textarea } from 'zephyrex/ui/textarea';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import { giftsApi, useGifts, useShopLink } from './giftsApi';
import { type Gift, type GiftIdea, type GiftPerson, STATUSES, statusLabel } from './giftsModel';

const SELECT = 'h-9 rounded-md border bg-background px-3 text-sm font-normal';
const LINK = 'underline underline-offset-4';
const SOMEONE_ELSE = '';

/** A title as a heading: its first letter in capitals ("peonies" → "Peonies"). */
const capitalised = (text: string): string => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

function Problem({ problem }: { problem: string | null }): ReactNode {
  return problem === null ? null : (
    <p role='alert' className='text-sm text-destructive'>
      {problem}
    </p>
  );
}

/** A link to search the shop for `query`, once the server has made it. */
/** A steady hue per name, so someone's gifts carry the same colour every visit. */
/** Up to this many people, "For" is a row of chips; beyond it, a list. */
const CHIP_PEOPLE = 8;

/** A string hash's multiplier, and the hue circle it lands on. */
const HASH_MULTIPLIER = 31;
const HUE_DEGREES = 360;

function hueOfName(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * HASH_MULTIPLIER + (char.codePointAt(0) ?? 0)) % HUE_DEGREES;
  }
  return hash;
}

function ShopSearch({ query }: { query: string }): ReactNode {
  const [asked, setAsked] = useState(false);
  const link = useShopLink(asked ? query : null);
  if (!asked) {
    return (
      <button
        type='button'
        className='justify-self-start text-sm font-medium text-primary underline-offset-4 hover:underline'
        onClick={() => setAsked(true)}
        aria-label={`Find it at the shop: ${query}`}
      >
        Find it at the shop
      </button>
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
  // The form lives in a dialog the list's header opens; it closes once the gift is saved.
  const [open, setOpen] = useState(false);
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
        setOpen(false);
        notify('Gift added', `${title.trim()} for ${forName}`);
        await onAdded();
      }
    })();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type='button'>Add gift</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a gift</DialogTitle>
          <DialogDescription>Only you ever see this list.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} aria-label='Add a gift' className='grid gap-3 sm:grid-cols-2'>
          {people.length <= CHIP_PEOPLE ? (
            <fieldset className='col-span-full grid min-w-0 gap-1.5'>
              <legend id={ids.who} className='mb-1.5 text-sm font-medium'>
                For
              </legend>
              <div className='flex flex-wrap gap-1.5' ref={chipGroup}>
                {[
                  ...people.map((candidate) => ({ ref: candidate.ref, name: candidate.name })),
                  { ref: SOMEONE_ELSE, name: 'Someone else' },
                ].map((choice) => (
                  <button
                    key={choice.ref}
                    type='button'
                    aria-pressed={who === choice.ref}
                    onClick={() => setChosen(choice.ref)}
                    className='inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-3 text-sm text-muted-foreground transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground'
                  >
                    <span
                      aria-hidden='true'
                      className='flex size-6 items-center justify-center rounded-full text-[0.65rem] font-semibold text-white'
                      style={{
                        backgroundColor:
                          choice.ref === SOMEONE_ELSE
                            ? 'hsl(var(--muted-foreground))'
                            : `hsl(${String(hueOfName(choice.name))} 45% 30%)`,
                      }}
                    >
                      {choice.ref === SOMEONE_ELSE ? '+' : choice.name.charAt(0).toUpperCase()}
                    </span>
                    {choice.name}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
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
          )}
          {person === undefined ? (
            <label htmlFor={ids.name} className='grid gap-1 text-sm font-medium'>
              Their name
              <Input id={ids.name} value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required />
            </label>
          ) : (
            people.length > CHIP_PEOPLE && <span aria-hidden='true' className='hidden sm:block' />
          )}
          <label htmlFor={ids.title} className='grid gap-1 text-sm font-medium'>
            Gift
            <Input
              id={ids.title}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
            />
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
          <label htmlFor={ids.note} className='grid gap-1 text-sm font-medium col-span-full'>
            Note (optional)
            <Textarea
              id={ids.note}
              rows={2}
              className='field-sizing-content min-h-16 resize-none font-normal'
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder='Size, colour, the occasion'
              maxLength={2000}
            />
          </label>
          <div className='col-span-full grid gap-2'>
            <Problem problem={problem} />
            <Button type='submit' className='justify-self-start' disabled={title.trim() === '' || forName === ''}>
              Add the gift
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GiftRow({ gift, onChanged }: { gift: Gift; onChanged: () => Promise<unknown> }): ReactNode {
  const client = useClient();
  const statusId = useId();
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Deleted, but still within its undo window: hidden here until the notice goes or Undo brings it back.
  const [leaving, setLeaving] = useState(false);
  const run = (write: Promise<unknown>, fallback: string, done?: string): void => {
    setBusy(true);
    void (async (): Promise<void> => {
      const failed = await writeProblem(write, fallback);
      setProblem(failed);
      if (failed === null && done !== undefined) {
        notify(done);
      }
      await onChanged();
      setBusy(false);
    })();
  };
  const link = gift.url ?? null;
  // Edits the title or note in place; the reason it failed, or null.
  const change = async (changes: { title?: string; note?: string }, fallback: string): Promise<string | null> => {
    const failed = await writeProblem(giftsApi.edit(client, gift, changes), fallback);
    if (failed === null) {
      await onChanged();
    }
    return failed;
  };
  if (leaving && problem === null) {
    return null;
  }
  return (
    <li data-row className='group grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-4'>
      <div className='grid min-w-0 gap-0.5'>
        <InlineText
          value={gift.title}
          label='Gift'
          rowOpen
          onSave={async (title) => change({ title }, 'The gift could not be renamed.')}
          className={gift.status === 'given' ? 'font-medium text-muted-foreground line-through' : 'font-medium'}
        />
        <div className='flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground'>
          <InlineText
            value={gift.note ?? ''}
            label='Note'
            placeholder='Add a note'
            onSave={async (note) => change({ note }, 'The note could not be saved.')}
          />
          <span aria-hidden='true'>·</span>
          {link === null ? (
            <ShopSearch query={gift.title} />
          ) : (
            <a className={LINK} href={link} target='_blank' rel='noopener noreferrer sponsored'>
              Where to buy it
            </a>
          )}
        </div>
      </div>
      <div className='flex items-center justify-between gap-2 sm:justify-end'>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          disabled={busy}
          aria-label={`Delete ${gift.title}`}
          data-row-remove
          className='order-last text-muted-foreground transition-opacity hover:text-destructive sm:order-none pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100'
          onClick={() => {
            setLeaving(true);
            deferWithUndo(
              `${gift.title} deleted`,
              () => {
                run(giftsApi.remove(client, gift), 'The gift could not be deleted.');
              },
              () => {
                setLeaving(false);
              },
            );
          }}
        >
          Delete
        </Button>
        <span id={statusId} className='sr-only'>
          {`Where ${gift.title} is`}
        </span>
        <div role='radiogroup' aria-labelledby={statusId} className='inline-flex rounded-full border p-0.5'>
          {STATUSES.map((status) => (
            <label
              key={status}
              className='cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'
            >
              <input
                type='radio'
                className='sr-only'
                name={statusId}
                value={status}
                checked={gift.status === status}
                disabled={busy}
                onChange={() =>
                  run(
                    giftsApi.setStatus(client, gift, status),
                    'That could not be saved.',
                    `${gift.title}: ${statusLabel(status).toLowerCase()}`,
                  )
                }
              />
              {statusLabel(status)}
            </label>
          ))}
        </div>
      </div>
      <div className='sm:col-span-2'>
        <Problem problem={problem} />
      </div>
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
        notify('Saved to your list', idea.title);
        setSaved((current) => [...current, keyOf(idea)]);
        await onSaved();
      }
    })();
  };
  return (
    <div className='grid gap-2'>
      <Problem problem={problem} />
      <ul aria-label='Ideas' className='grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
        {ideas.map((idea) => (
          <li key={keyOf(idea)} className='grid gap-2 rounded-lg border bg-muted/20 p-3'>
            <span className='grid'>
              <span className='font-medium'>{capitalised(idea.title)}</span>
              <span className='text-sm text-muted-foreground'>
                For {idea.forName}
                {idea.note === undefined ? '' : ` · ${idea.note}`}
              </span>
            </span>
            <span className='flex flex-wrap items-center gap-2'>
              {saved.includes(keyOf(idea)) ? (
                <span className='text-sm text-muted-foreground'>Saved to your list</span>
              ) : (
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => save(idea)}
                  aria-label={`Save to list: ${idea.title}`}
                >
                  Save to list
                </Button>
              )}
              <ShopSearch query={idea.title} />
            </span>
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
        <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>Gifts</h1>
        <p className='text-muted-foreground'>Ideas for the people in your life. Only you ever see this list.</p>
      </div>
      <div className={ideas.length > 0 ? 'grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]' : 'grid gap-6'}>
        {ideas.length > 0 && (
          <Card className='order-2 xl:sticky xl:top-6'>
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
          <CardHeader className='flex-row flex-wrap items-start justify-between gap-3 space-y-0'>
            <div className='grid gap-1.5'>
              <CardTitle>Your gift list</CardTitle>
              <CardDescription>What you mean to give, and whether you have bought or given it yet.</CardDescription>
            </div>
            <AddGift people={people} onAdded={refresh} />
          </CardHeader>
          <CardContent ref={rowList} className='grid gap-6'>
            {gifts.error !== undefined && (
              <LoadProblem what='your gift list' error={gifts.error} onRetry={async () => gifts.mutate()} />
            )}
            {gifts.error === undefined && gifts.data === undefined && <SkeletonRows rows={3} label='Loading your gifts' />}
            {gifts.data?.length === 0 && (
              <p className='rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground'>
                {ideas.length > 0
                  ? 'No gifts yet. Save one of the ideas, or add one yourself.'
                  : 'No gifts yet. Add one yourself; ideas appear here once the people in your tree have sizes or favourites on their cards.'}
              </p>
            )}
            {[...byPerson.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([name, theirs]) => (
                <section key={name} aria-label={`For ${name}`} className='grid gap-1'>
                  <h2 className='flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                    <span
                      aria-hidden='true'
                      className='inline-flex size-6 items-center justify-center rounded-full text-[0.65rem] font-semibold normal-case text-white'
                      style={{ backgroundColor: `hsl(${String(hueOfName(name))} 45% 30%)` }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </span>
                    For {name}
                    <span className='font-normal normal-case tracking-normal tabular-nums'>· {String(theirs.length)}</span>
                  </h2>
                  <ul className='divide-y'>
                    {theirs.map((gift) => (
                      <GiftRow key={gift.id} gift={gift} onChanged={refresh} />
                    ))}
                  </ul>
                </section>
              ))}
          </CardContent>
        </Card>
      </div>
      <p className='text-xs text-muted-foreground'>
        As an Amazon Associate, the people who run this app earn from qualifying purchases made through its links.
      </p>
    </div>
  );
}
