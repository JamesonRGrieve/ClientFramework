// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useUser, writeProblem } from 'zephyrex';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Input } from 'zephyrex/ui/input';
import { useMediaSearch, usePick, useWatchListActions, useWatchLists, type WatchListActions } from './mediaApi';
import { everyoneOn, type MediaItem, type MediaPerson, type Title, titleLabel, type WatchList } from './mediaModel';

const SELECT = 'h-9 rounded-md border bg-background px-3 text-sm font-normal';
const LINK = 'underline underline-offset-4';
const TMDB_NOTICE = 'This product uses the TMDB API but is not endorsed or certified by TMDB.';
const NOBODY = '';

/** What to call an account: "You", the name the app knows it by, or "Someone". */
type NameOf = (userId: string) => string;

function useNames(people: readonly MediaPerson[]): { me: string | undefined; nameOf: NameOf } {
  const me = useUser().data?.id;
  const nameOf: NameOf = (userId) =>
    userId === me ? 'You' : (people.find((person) => person.userId === userId)?.name ?? 'Someone');
  return { me, nameOf };
}

/** Runs `write`, keeping its problem for the page to show. */
function useWrite(): { problem: string | null; busy: boolean; run: (write: Promise<unknown>, fallback: string) => void } {
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = (write: Promise<unknown>, fallback: string): void => {
    setBusy(true);
    void (async (): Promise<void> => {
      setProblem(await writeProblem(write, fallback));
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

function Poster({ item, size }: { item: Pick<MediaItem, 'image' | 'title'>; size: 'small' | 'large' }): ReactNode {
  const box = size === 'large' ? 'h-36 w-24' : 'h-18 w-12';
  const image = item.image ?? null;
  return image === null ? (
    <div aria-hidden='true' className={`${box} shrink-0 rounded bg-muted`} />
  ) : (
    // Decorative (the title is beside it), so a background, not an img: a package cannot set the
    // app's next/image hosts. The URL goes in quoted, so nothing in it can end the url().
    <div
      aria-hidden='true'
      className={`${box} shrink-0 rounded bg-muted bg-cover bg-center`}
      style={{ backgroundImage: `url(${JSON.stringify(image)})` }}
    />
  );
}

function Tonight({ list, nameOf }: { list: WatchList; nameOf: NameOf }): ReactNode {
  const pick = usePick(list.id);
  const title = pick.data?.title ?? null;
  return (
    <section aria-label='Tonight' className='grid gap-3'>
      <h2 className='text-lg font-semibold'>Tonight’s pick</h2>
      {pick.error !== undefined && <Problem problem={pick.error.message} />}
      {pick.data !== undefined && title === null && (
        <p className='text-sm text-muted-foreground'>Add films and say which you want to see; the pick comes from those.</p>
      )}
      {pick.data !== undefined && title !== null && (
        <div className='flex gap-4'>
          <Poster item={title} size='large' />
          <div className='grid content-start gap-1'>
            <span className='text-xl font-semibold'>{titleLabel(title)}</span>
            <span className='text-sm'>
              {pick.data.everyone
                ? 'Everyone on the list wants to see it.'
                : `${String(pick.data.wanted_by)} of ${String(pick.data.of)} want to see it.`}
            </span>
            <span className='text-sm text-muted-foreground'>{title.wanted_by.map(nameOf).join(', ')}</span>
            {title.overview !== null && title.overview !== undefined && (
              <p className='mt-1 line-clamp-3 max-w-prose text-sm text-muted-foreground'>{title.overview}</p>
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
      <form onSubmit={search} className='flex flex-wrap items-end gap-2'>
        <label htmlFor={fieldId} className='grid min-w-56 flex-1 gap-1 text-sm font-medium'>
          Find a film
          <Input id={fieldId} value={typed} onChange={(event) => setTyped(event.target.value)} placeholder='A title' />
        </label>
        <Button type='submit' disabled={typed.trim() === ''}>
          Search
        </Button>
      </form>
      {found.error !== undefined && <Problem problem={found.error.message} />}
      <Problem problem={write.problem} />
      {found.data?.length === 0 && <p className='text-sm text-muted-foreground'>Nothing in the catalogue by that name.</p>}
      {(found.data ?? []).length > 0 && (
        <ul aria-label='Search results' className='divide-y'>
          {(found.data ?? []).map((item) => (
            <li key={item.id} className='flex items-center gap-3 py-2'>
              <Poster item={item} size='small' />
              <span className='flex-1'>{titleLabel(item)}</span>
              {onList.has(item.id) ? (
                <span className='text-sm text-muted-foreground'>On the list</span>
              ) : (
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  disabled={write.busy}
                  aria-label={`Add ${titleLabel(item)}`}
                  onClick={() => write.run(actions.add(list, item.id), 'The film could not be added.')}
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
  return (
    <li className='flex gap-3 py-3'>
      <Poster item={title} size='small' />
      <div className='grid flex-1 gap-1'>
        <span className={watched ? 'font-medium text-muted-foreground line-through' : 'font-medium'}>{label}</span>
        <span className='text-sm text-muted-foreground'>
          {title.wanted_by.length === 0
            ? 'Nobody wants to see it yet'
            : `Wanted by ${title.wanted_by.map(nameOf).join(', ')}`}
        </span>
        <div className='flex flex-wrap items-center gap-2'>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={wanted}
              disabled={write.busy}
              onChange={(event) =>
                write.run(actions.want(list, title.title_id, event.target.checked), 'That could not be saved.')
              }
            />
            I want to see it
          </label>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            disabled={write.busy}
            aria-label={watched ? `Not watched ${label} yet` : `Watched ${label}`}
            onClick={() => write.run(actions.watched(list, title.title_id, !watched), 'That could not be saved.')}
          >
            {watched ? 'Not watched yet' : 'Watched it'}
          </Button>
          {removable && (
            <Button
              type='button'
              size='sm'
              variant='ghost'
              disabled={write.busy}
              aria-label={`Take ${label} off`}
              onClick={() => write.run(actions.remove(list, title.title_id), 'The film could not be taken off.')}
            >
              Take off
            </Button>
          )}
        </div>
        <Problem problem={write.problem} />
      </div>
    </li>
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
  const pickerId = useId();
  const [chosen, setChosen] = useState(NOBODY);
  const write = useWrite();
  const keeping = me === list.keeper_id;
  const on = new Set(everyoneOn(list));
  const offered = people.filter((person) => !on.has(person.userId));
  return (
    <section aria-label='Who is on the list' className='grid gap-3'>
      <h2 className='text-lg font-semibold'>Who is on the list</h2>
      <ul className='grid gap-1 text-sm'>
        <li>{nameOf(list.keeper_id)} (keeps the list)</li>
        {list.member_ids.map((userId) => (
          <li key={userId} className='flex items-center gap-2'>
            {nameOf(userId)}
            {keeping && (
              <Button
                type='button'
                size='sm'
                variant='ghost'
                disabled={write.busy}
                aria-label={`Take ${nameOf(userId)} off the list`}
                onClick={() => write.run(actions.unshare(list, userId), 'They could not be taken off.')}
              >
                Take off
              </Button>
            )}
          </li>
        ))}
      </ul>
      {keeping && offered.length > 0 && (
        <div className='flex flex-wrap items-end gap-2'>
          <label htmlFor={pickerId} className='grid gap-1 text-sm font-medium'>
            Share with
            <select id={pickerId} value={chosen} onChange={(event) => setChosen(event.target.value)} className={SELECT}>
              <option value={NOBODY}>Choose someone…</option>
              {offered.map((person) => (
                <option key={person.userId} value={person.userId}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            type='button'
            disabled={chosen === NOBODY || write.busy}
            onClick={() => {
              write.run(actions.share(list, chosen), 'The list could not be shared.');
              setChosen(NOBODY);
            }}
          >
            Share
          </Button>
        </div>
      )}
      {!keeping && me !== undefined && (
        <Button
          type='button'
          variant='outline'
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
  const [name, setName] = useState('Movie night');
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
    <form onSubmit={start} aria-label='Start a list' className='flex flex-wrap items-end gap-2'>
      <label htmlFor={fieldId} className='grid gap-1 text-sm font-medium'>
        {first ? 'Name your first list' : 'Start another list'}
        <Input id={fieldId} value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
      </label>
      <Button type='submit' disabled={name.trim() === ''}>
        Start the list
      </Button>
      <Problem problem={problem} />
    </form>
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
  const listId = useId();
  const [chosen, setChosen] = useState<string | null>(null);
  const all = lists.data ?? [];
  const list = all.find((candidate) => candidate.id === chosen) ?? all.at(0);
  return (
    <div className='grid gap-6'>
      <div className='grid gap-1'>
        <h1 className='text-3xl font-semibold'>Watch-list</h1>
        <p className='text-muted-foreground'>
          The films you want to see together, and tonight’s pick: something everyone on the list wants to watch.
        </p>
      </div>
      {lists.error !== undefined && <Problem problem={lists.error.message} />}
      {lists.data !== undefined && list === undefined && (
        <Card>
          <CardHeader>
            <CardTitle>Start a watch-list</CardTitle>
            <CardDescription>Share it with the people you watch with, then add films.</CardDescription>
          </CardHeader>
          <CardContent>{wrapStart(<StartList actions={actions} onStarted={setChosen} first />)}</CardContent>
        </Card>
      )}
      {list !== undefined && (
        <>
          {all.length > 1 && (
            <label htmlFor={listId} className='grid max-w-sm gap-1 text-sm font-medium'>
              List
              <select id={listId} value={list.id} onChange={(event) => setChosen(event.target.value)} className={SELECT}>
                {all.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{list.name}</CardTitle>
              <CardDescription>
                {everyoneOn(list).length === 1 ? 'Just you so far.' : `${String(everyoneOn(list).length)} people on it.`}
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-8'>
              <Tonight list={list} nameOf={nameOf} />
              <AddTitles list={list} actions={actions} />
              {list.titles.length > 0 && (
                <ul aria-label='On the list' className='divide-y'>
                  {list.titles.map((title) => (
                    <TitleRow key={title.title_id} list={list} title={title} me={me} nameOf={nameOf} actions={actions} />
                  ))}
                </ul>
              )}
              <People list={list} people={people} me={me} nameOf={nameOf} actions={actions} />
            </CardContent>
          </Card>
          {wrapStart(<StartList actions={actions} onStarted={setChosen} first={false} />)}
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
