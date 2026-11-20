// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { ChoiceChip } from 'zephyrex/ui/choice-chip';
import { chipGroup } from 'zephyrex/hooks/chipKeys';
import { type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useUser, writeProblem } from 'zephyrex';
import { deferWithUndo, notify } from 'zephyrex/hooks/useToast';
import { LoadProblem } from 'zephyrex/ui/load-problem';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from 'zephyrex/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'zephyrex/ui/dialog';
import { Input } from 'zephyrex/ui/input';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import { useMediaSearch, usePick, useWatchListActions, useWatchLists, type WatchListActions } from './mediaApi';
import { everyoneOn, type MediaItem, type MediaPerson, type Title, titleLabel, type WatchList } from './mediaModel';

const LINK = 'underline underline-offset-4';
const TMDB_NOTICE = 'This product uses the TMDB API but is not endorsed or certified by TMDB.';
const CHIP =
  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground aria-checked:border-primary aria-checked:bg-primary/10 aria-checked:text-foreground disabled:opacity-55';
const HUES = 360;
const HUE_SEED = 31;
const STACK_MAX = 4;

/** A steady hue per account, so someone is the same colour on every list. */
function hueOf(userId: string): number {
  let hash = 0;
  for (const char of userId) {
    hash = (hash * HUE_SEED + (char.codePointAt(0) ?? 0)) % HUES;
  }
  return hash;
}

function Avatar({ userId, name, size = 'sm' }: { userId: string; name: string; size?: 'sm' | 'md' }): ReactNode {
  const box = size === 'md' ? 'size-8 text-xs' : 'size-6 text-[0.65rem]';
  return (
    <span
      aria-hidden='true'
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-background`}
      style={{ backgroundColor: `hsl(${String(hueOf(userId))} 45% 30%)` }}
    >
      {name === 'You' ? 'Y' : name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Who wants a title, as overlapping avatars; the names are in the label. */
function Wanters({ ids, nameOf }: { ids: readonly string[]; nameOf: NameOf }): ReactNode {
  if (ids.length === 0) {
    return <span className='text-xs text-muted-foreground'>Nobody yet</span>;
  }
  const names = ids.map(nameOf);
  return (
    <span className='inline-flex items-center gap-2' title={names.join(', ')}>
      <span className='flex -space-x-1.5'>
        {ids.slice(0, STACK_MAX).map((id) => (
          <Avatar key={id} userId={id} name={nameOf(id)} />
        ))}
      </span>
      <span className='sr-only'>Wanted by {names.join(', ')}</span>
      {ids.length > STACK_MAX && <span className='text-xs text-muted-foreground'>+{String(ids.length - STACK_MAX)}</span>}
    </span>
  );
}

/** What to call an account: "You", the name the app knows it by, or "Someone". */
type NameOf = (userId: string) => string;

function useNames(people: readonly MediaPerson[]): { me: string | undefined; nameOf: NameOf } {
  const me = useUser().data?.id;
  const nameOf: NameOf = (userId) =>
    userId === me ? 'You' : (people.find((person) => person.userId === userId)?.name ?? 'Someone');
  return { me, nameOf };
}

/** Runs `write`, keeping its problem for the page to show. */
function useWrite(): {
  problem: string | null;
  busy: boolean;
  run: (write: Promise<unknown>, fallback: string, done?: string) => void;
} {
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = (write: Promise<unknown>, fallback: string, done?: string): void => {
    setBusy(true);
    void (async (): Promise<void> => {
      const failed = await writeProblem(write, fallback);
      setProblem(failed);
      if (failed === null && done !== undefined) {
        notify(done);
      }
      setBusy(false);
    })();
  };
  return { problem, busy, run };
}

function Problem({ problem }: { problem: string | null }): ReactNode {
  return problem === null ? null : (
    <p role='alert' className='text-sm text-destructive'>
      {problem}
    </p>
  );
}

/** A stable hue from a title, so each film's placeholder keeps its colour. */
/** A string hash's multiplier, the hue circle, and how far a placeholder's gradient turns. */
const HASH_MULTIPLIER = 31;
const HUE_DEGREES = 360;
const GRADIENT_HUE_TURN = 40;
/** The empty list's fanned posters: each tilts this far, and the middle one lifts. */
const FAN_TILT_DEGREES = 6;
const FAN_LIFT_PX = 4;

function titleHue(title: string): number {
  let hash = 0;
  for (const char of title) {
    hash = (hash * HASH_MULTIPLIER + (char.codePointAt(0) ?? 0)) % HUE_DEGREES;
  }
  return hash;
}

function Poster({ item, size }: { item: Pick<MediaItem, 'image' | 'title'>; size: 'small' | 'large' }): ReactNode {
  const box = size === 'large' ? 'h-44 w-30 sm:h-52 sm:w-36' : 'h-18 w-12';
  const image = item.image ?? null;
  const hue = titleHue(item.title);
  return image === null ? (
    // No poster: a film-strip mark on a tint of the title's own, so films without art still differ.
    <div
      aria-hidden='true'
      className={`${box} flex shrink-0 items-center justify-center rounded-md text-white/55 shadow-sm`}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${String(hue)} 35% 26%), hsl(${String((hue + GRADIENT_HUE_TURN) % HUE_DEGREES)} 30% 14%))`,
      }}
    >
      <svg
        aria-hidden='true'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={1.5}
        strokeLinecap='round'
        strokeLinejoin='round'
        className={size === 'large' ? 'size-10' : 'size-5'}
      >
        <rect x='3' y='3' width='18' height='18' rx='2' />
        <path d='M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4' />
      </svg>
    </div>
  ) : (
    // Decorative (the title is beside it), so a background, not an img: a package cannot set the
    // app's next/image hosts. The URL goes in quoted, so nothing in it can end the url().
    <div
      aria-hidden='true'
      className={`${box} shrink-0 rounded-md bg-muted bg-cover bg-center shadow-sm`}
      style={{ backgroundImage: `url(${JSON.stringify(image)})` }}
    />
  );
}

function Tonight({ list, nameOf }: { list: WatchList; nameOf: NameOf }): ReactNode {
  const pick = usePick(list.id);
  const title = pick.data?.title ?? null;
  const backdrop = title?.image ?? null;
  return (
    <section
      aria-label='Tonight'
      className='relative isolate overflow-hidden rounded-xl border bg-gradient-to-br from-primary/15 via-card to-card p-5'
    >
      {backdrop !== null && (
        <div
          aria-hidden='true'
          className='absolute inset-0 -z-10 scale-110 bg-cover bg-center opacity-15 blur-2xl'
          style={{ backgroundImage: `url(${JSON.stringify(backdrop)})` }}
        />
      )}
      <h2 className='text-xs font-semibold uppercase tracking-wide text-primary'>Tonight’s pick</h2>
      {pick.error !== undefined && <Problem problem={pick.error.message} />}
      {pick.data !== undefined && title === null && (
        <p className='mt-2 max-w-prose text-sm text-muted-foreground'>
          Nothing to pick from yet. Add films and say which you want to see, and the pick comes from those.
        </p>
      )}
      {pick.data !== undefined && title !== null && (
        <div className='mt-3 flex gap-5'>
          <Poster item={title} size='large' />
          <div className='grid content-start gap-2'>
            <span className='text-2xl font-semibold leading-tight'>{titleLabel(title)}</span>
            <span
              className={`w-fit max-w-full justify-self-start rounded-lg px-2.5 py-0.5 text-xs font-semibold text-balance ${pick.data.everyone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {pick.data.everyone ? (
                <>
                  <span className='sm:hidden' aria-hidden='true'>
                    Everyone wants it
                  </span>
                  <span className='max-sm:sr-only'>Everyone on the list wants to see it.</span>
                </>
              ) : (
                `${String(pick.data.wanted_by)} of ${String(pick.data.of)} want to see it.`
              )}
            </span>
            <Wanters ids={title.wanted_by} nameOf={nameOf} />
            {title.overview !== null && title.overview !== undefined && (
              <p className='line-clamp-4 max-w-prose text-sm text-muted-foreground'>{title.overview}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function AddTitles({ list, actions }: { list: WatchList; actions: WatchListActions }): ReactNode {
  const fieldId = useId();
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState<string | null>(null);
  const found = useMediaSearch(query);
  const write = useWrite();
  const onList = new Set(list.titles.map((title) => title.id));
  const search = (event: SyntheticEvent): void => {
    event.preventDefault();
    setQuery(typed);
  };
  return (
    <section aria-label='Add films' className='grid gap-3'>
      <search>
        <form onSubmit={search} className='flex gap-2'>
          <label htmlFor={fieldId} className='sr-only'>
            Find a film
          </label>
          <div className='relative flex-1'>
            <svg
              aria-hidden='true'
              viewBox='0 0 24 24'
              className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 fill-none stroke-current stroke-2 text-muted-foreground'
            >
              <circle cx='11' cy='11' r='7' />
              <path d='m20 20-3.5-3.5' />
            </svg>
            <Input
              id={fieldId}
              type='search'
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder='Find a film to add'
              className='pl-9'
            />
          </div>
          <Button type='submit' variant='outline' disabled={typed.trim() === ''}>
            Search
          </Button>
        </form>
      </search>
      {found.error !== undefined && <Problem problem={found.error.message} />}
      <Problem problem={write.problem} />
      {found.data?.length === 0 && <p className='text-sm text-muted-foreground'>Nothing in the catalogue by that name.</p>}
      {(found.data ?? []).length > 0 && (
        <ul aria-label='Search results' className='grid gap-2 sm:grid-cols-2'>
          {(found.data ?? []).map((item) => (
            <li key={item.id} className='flex items-center gap-3 rounded-lg border p-2'>
              <Poster item={item} size='small' />
              <span className='min-w-0 flex-1 text-sm font-medium'>{titleLabel(item)}</span>
              {onList.has(item.id) ? (
                <span className='text-xs text-muted-foreground'>On the list</span>
              ) : (
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  disabled={write.busy}
                  aria-label={`Add ${titleLabel(item)}`}
                  onClick={() =>
                    write.run(actions.add(list, item.id), 'The film could not be added.', `${titleLabel(item)} added`)
                  }
                >
                  Add
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TitleRow({
  list,
  title,
  me,
  nameOf,
  actions,
}: {
  list: WatchList;
  title: Title;
  me: string | undefined;
  nameOf: NameOf;
  actions: WatchListActions;
}): ReactNode {
  const write = useWrite();
  const wanted = me !== undefined && title.wanted_by.includes(me);
  const watched = title.watched_on !== null && title.watched_on !== undefined;
  const removable = me !== undefined && (me === list.keeper_id || me === title.added_by);
  const label = titleLabel(title);
  // Taken off, but still within its undo window: hidden until the notice goes or Undo brings it back.
  const [leaving, setLeaving] = useState(false);
  if (leaving && write.problem === null) {
    return null;
  }
  return (
    <li
      className={`group flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 ${watched ? 'text-muted-foreground [&_img]:grayscale' : ''}`}
    >
      <Poster item={title} size='small' />
      <div className='grid min-w-0 flex-1 gap-1'>
        <span className={watched ? 'truncate font-medium line-through' : 'truncate font-medium'}>{label}</span>
        <Wanters ids={title.wanted_by} nameOf={nameOf} />
        <Problem problem={write.problem} />
      </div>
      <div className='flex w-full flex-wrap items-center gap-1.5 pl-15 sm:w-auto sm:shrink-0 sm:justify-end sm:pl-0'>
        {removable && (
          <Button
            type='button'
            size='sm'
            variant='ghost'
            disabled={write.busy}
            aria-label={`Take off ${label}`}
            className='order-last text-muted-foreground transition-opacity hover:text-destructive sm:order-none pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100'
            onClick={() => {
              setLeaving(true);
              deferWithUndo(
                `${label} taken off`,
                () => {
                  write.run(actions.remove(list, title.title_id), 'The film could not be taken off.');
                },
                () => {
                  setLeaving(false);
                },
              );
            }}
          >
            Take off
          </Button>
        )}
        <button
          type='button'
          aria-pressed={wanted}
          disabled={write.busy || me === undefined}
          aria-label={`Want ${label}`}
          onClick={() => write.run(actions.want(list, title.title_id, !wanted), 'That could not be saved.')}
          className={CHIP}
        >
          <span aria-hidden='true'>{wanted ? '♥' : '♡'}</span>
          Want
        </button>
        <button
          type='button'
          aria-pressed={watched}
          disabled={write.busy}
          aria-label={`Watched ${label}`}
          onClick={() => write.run(actions.watched(list, title.title_id, !watched), 'That could not be saved.')}
          className={CHIP}
        >
          <span aria-hidden='true'>{watched ? '✓' : '○'}</span>
          Watched
        </button>
      </div>
    </li>
  );
}

function Titles({
  list,
  me,
  nameOf,
  actions,
}: {
  list: WatchList;
  me: string | undefined;
  nameOf: NameOf;
  actions: WatchListActions;
}): ReactNode {
  const [showWatched, setShowWatched] = useState(false);
  const isWatched = (title: Title): boolean => title.watched_on !== null && title.watched_on !== undefined;
  const watchedCount = list.titles.filter(isWatched).length;
  const shown = list.titles.filter((title) => showWatched || !isWatched(title));
  if (list.titles.length === 0) {
    return (
      <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
        No films on the list yet. Search above to add the first.
      </p>
    );
  }
  return (
    <section aria-label='Films' className='grid gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-sm font-semibold'>
          On the list <span className='font-normal text-muted-foreground'>· {String(list.titles.length)}</span>
        </h2>
        {watchedCount > 0 && (
          <button type='button' aria-pressed={showWatched} onClick={() => setShowWatched(!showWatched)} className={CHIP}>
            Show watched ({String(watchedCount)})
          </button>
        )}
      </div>
      <ul aria-label='On the list' className='divide-y'>
        {shown.map((title) => (
          <TitleRow key={title.title_id} list={list} title={title} me={me} nameOf={nameOf} actions={actions} />
        ))}
      </ul>
    </section>
  );
}

function People({
  list,
  people,
  me,
  nameOf,
  actions,
}: {
  list: WatchList;
  people: readonly MediaPerson[];
  me: string | undefined;
  nameOf: NameOf;
  actions: WatchListActions;
}): ReactNode {
  const write = useWrite();
  const keeping = me === list.keeper_id;
  const on = new Set(everyoneOn(list));
  const offered = people.filter((person) => !on.has(person.userId));
  return (
    <section aria-label='Who is on the list' className='grid content-start gap-3'>
      <h2 className='text-sm font-semibold'>Who is on the list</h2>
      <ul className='grid gap-2 text-sm'>
        <li className='flex items-center gap-2'>
          <Avatar userId={list.keeper_id} name={nameOf(list.keeper_id)} size='md' />
          <span className='flex-1'>{nameOf(list.keeper_id)}</span>
          <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>Keeps the list</span>
        </li>
        {list.member_ids.map((userId) => (
          <li key={userId} className='group flex items-center gap-2'>
            <Avatar userId={userId} name={nameOf(userId)} size='md' />
            <span className='flex-1'>{nameOf(userId)}</span>
            {keeping && (
              <Button
                type='button'
                size='sm'
                variant='ghost'
                disabled={write.busy}
                aria-label={`Take off the list: ${nameOf(userId)}`}
                className='text-muted-foreground transition-opacity hover:text-destructive pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100'
                onClick={() => write.run(actions.unshare(list, userId), 'They could not be taken off.')}
              >
                Take off
              </Button>
            )}
          </li>
        ))}
      </ul>
      {keeping && offered.length > 0 && (
        <fieldset aria-label='Share with' className='min-w-0 grid gap-2 border-t pt-3'>
          <span className='text-xs font-medium text-muted-foreground'>Share with</span>
          <div className='flex flex-wrap gap-1.5' ref={chipGroup}>
            {offered.map((person) => (
              <button
                key={person.userId}
                type='button'
                disabled={write.busy}
                aria-label={`Share with ${person.name}`}
                onClick={() =>
                  write.run(
                    actions.share(list, person.userId),
                    'The list could not be shared.',
                    `Shared with ${person.name}`,
                  )
                }
                className={`${CHIP} py-0.5 pl-0.5`}
              >
                <Avatar userId={person.userId} name={person.name} />
                {person.name}
                <span aria-hidden='true' className='text-primary'>
                  +
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {!keeping && me !== undefined && (
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='justify-self-start'
          disabled={write.busy}
          onClick={() => write.run(actions.unshare(list, me), 'You could not leave the list.')}
        >
          Leave this list
        </Button>
      )}
      <Problem problem={write.problem} />
    </section>
  );
}

function StartList({
  actions,
  onStarted,
  first,
}: {
  actions: WatchListActions;
  onStarted: (id: string) => void;
  first: boolean;
}): ReactElement {
  const fieldId = useId();
  const [name, setName] = useState(first ? 'Movie night' : '');
  const [problem, setProblem] = useState<string | null>(null);
  const start = (event: SyntheticEvent): void => {
    event.preventDefault();
    void (async (): Promise<void> => {
      const starting = actions.start(name.trim());
      const failed = await writeProblem(starting, 'The list could not be started.');
      setProblem(failed);
      if (failed === null) {
        onStarted(await starting);
      }
    })();
  };
  return (
    <form onSubmit={start} aria-label='Start a list' className='grid gap-2'>
      <label htmlFor={fieldId} className='text-sm font-medium'>
        {first ? 'Name your first list' : 'Name'}
      </label>
      <div className='flex flex-wrap gap-2'>
        <Input
          id={fieldId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          placeholder={first ? undefined : 'Date night, the house…'}
          className='max-w-xs flex-1'
        />
        <Button type='submit' disabled={name.trim() === ''}>
          Start the list
        </Button>
      </div>
      <Problem problem={problem} />
    </form>
  );
}

const STEPS = [
  { title: 'Start a list', body: 'One per group you watch with: date night, the house, the long-distance call.' },
  { title: 'Share it', body: 'Add the people you watch with. Everyone adds films and marks what they want to see.' },
  {
    title: 'Get tonight’s pick',
    body: 'Cule picks something everyone wants to watch, so nobody has to scroll for an hour.',
  },
] as const;

/** The first run: what a watch-list is for, and the form to start one. */
function FirstList({ start }: { start: ReactNode }): ReactNode {
  return (
    <Card className='overflow-hidden'>
      <div className='grid gap-6 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:grid-cols-[1fr_auto] md:items-center'>
        <div className='grid gap-1'>
          <CardTitle className='text-xl'>Start a watch-list</CardTitle>
          <CardDescription>
            Stop deciding what to watch. Share a list and let the pick come from what you all want.
          </CardDescription>
        </div>
        <div aria-hidden='true' className='hidden gap-1.5 md:flex'>
          {['F', 'M', 'G'].map((letter, index) => (
            <div
              key={letter}
              className='flex h-24 w-16 items-center justify-center rounded-md bg-gradient-to-br from-muted to-muted/40 text-2xl text-muted-foreground/60 shadow-sm'
              style={{
                transform: `rotate(${String((index - 1) * FAN_TILT_DEGREES)}deg) translateY(${String(index === 1 ? -FAN_LIFT_PX : 0)}px)`,
              }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>
      <CardContent className='grid gap-6 pt-4 sm:pt-6'>
        <ol className='grid gap-4 sm:grid-cols-3'>
          {STEPS.map((step, index) => (
            <li key={step.title} className='flex gap-3'>
              <span className='inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary'>
                {String(index + 1)}
              </span>
              <div className='grid gap-0.5'>
                <span className='text-sm font-medium'>{step.title}</span>
                <span className='text-sm text-muted-foreground'>{step.body}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className='border-t pt-5'>{start}</div>
      </CardContent>
    </Card>
  );
}

export interface WatchListPageProps {
  /** The accounts the app knows: they name who wants what, and a list can be shared with them. */
  people?: readonly MediaPerson[];
  /** Wraps the form that starts a list, for an app that only lets some plans keep one. */
  wrapStart?: (form: ReactElement) => ReactNode;
}

/** Shared watch-lists: what everyone wants to see, and tonight's pick. */
export function WatchListPage({ people = [], wrapStart = (form) => form }: WatchListPageProps): ReactNode {
  const lists = useWatchLists();
  const actions = useWatchListActions();
  const { me, nameOf } = useNames(people);
  const [chosen, setChosen] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const all = lists.data ?? [];
  const list = all.find((candidate) => candidate.id === chosen) ?? all.at(0);
  const started = (id: string): void => {
    setChosen(id);
    setStarting(false);
  };
  return (
    <div className='grid gap-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='grid gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>Watch-list</h1>
          <p className='text-muted-foreground'>
            The films you want to see together, and tonight’s pick: something everyone on the list wants to watch.
          </p>
        </div>
        {list !== undefined && (
          <Dialog open={starting} onOpenChange={setStarting}>
            <DialogTrigger asChild>
              <Button variant='outline'>New list</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start another list</DialogTitle>
                <DialogDescription>For another group you watch with. You can share it once it is started.</DialogDescription>
              </DialogHeader>
              {wrapStart(<StartList actions={actions} onStarted={started} first={false} />)}
            </DialogContent>
          </Dialog>
        )}
      </div>
      {lists.error !== undefined && (
        <LoadProblem what='your watch-lists' error={lists.error} onRetry={async () => lists.mutate()} />
      )}
      {lists.error === undefined && lists.data === undefined && <SkeletonRows rows={3} label='Loading your lists' />}
      {lists.data !== undefined && list === undefined && (
        <FirstList start={wrapStart(<StartList actions={actions} onStarted={setChosen} first />)} />
      )}
      {list !== undefined && (
        <>
          {all.length > 1 && (
            <div role='radiogroup' aria-label='List' className='flex flex-wrap gap-2'>
              <div className='contents' ref={chipGroup}>
                {all.map((candidate) => (
                  <ChoiceChip
                    key={candidate.id}
                    checked={candidate.id === list.id}
                    onClick={() => setChosen(candidate.id)}
                    className={CHIP}
                  >
                    {candidate.name}
                    <span className='text-xs text-muted-foreground'>{String(candidate.titles.length)}</span>
                  </ChoiceChip>
                ))}
              </div>
            </div>
          )}
          <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]'>
            <div className='grid content-start gap-6'>
              <div className='flex items-baseline gap-2'>
                <h2 className='text-xl font-semibold'>{list.name}</h2>
                <span className='text-sm text-muted-foreground'>
                  {everyoneOn(list).length === 1 ? 'Just you so far' : `${String(everyoneOn(list).length)} people`}
                </span>
              </div>
              <Tonight list={list} nameOf={nameOf} />
              <AddTitles list={list} actions={actions} />
              <Titles list={list} me={me} nameOf={nameOf} actions={actions} />
            </div>
            <aside className='rounded-xl border p-4 lg:self-start'>
              <People list={list} people={people} me={me} nameOf={nameOf} actions={actions} />
            </aside>
          </div>
        </>
      )}
      {lists.data !== undefined && (
        <p className='text-xs text-muted-foreground'>
          Film details and posters from{' '}
          <a className={LINK} href='https://www.themoviedb.org' target='_blank' rel='noopener noreferrer'>
            TMDB
          </a>
          . {TMDB_NOTICE}
        </p>
      )}
    </div>
  );
}
