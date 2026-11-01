// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useUser, writeProblem } from 'zephyrex';
import { Badge } from 'zephyrex/ui/badge';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Input } from 'zephyrex/ui/input';
import { useMyRotas, useRotaActions, useSchedule, useSwaps } from './rotaApi';
import {
  cycleNightLabel,
  isoDay,
  MAX_CYCLE_DAYS,
  membersOf,
  nightAt,
  nightLabel,
  type Rota,
  type RotaPerson,
  type Swap,
} from './rotaModel';

/** How many nights ahead the schedule shows. */
const SHOWN_NIGHTS = 14;
const SELECT = 'h-9 rounded-md border bg-background px-3 text-sm font-normal';
const OPEN = '';

/** What to call an account: "You", the name the app knows it by, or "Someone". */
type NameOf = (userId: string | null) => string;

function useNames(people: readonly RotaPerson[]): { me: string | undefined; nameOf: NameOf } {
  const me = useUser().data?.id;
  const nameOf: NameOf = (userId) => {
    if (userId === null) {
      return 'Open';
    }
    if (userId === me) {
      return 'You';
    }
    return people.find((person) => person.userId === userId)?.name ?? 'Someone';
  };
  return { me, nameOf };
}

function Problem({ problem }: { problem: string | null }): ReactElement | null {
  return problem === null ? null : (
    <p role='alert' className='text-sm text-destructive'>
      {problem}
    </p>
  );
}

/** The next two weeks: whom each night is with, and a swap from each that is yours or someone else's. */
function Schedule({
  rota,
  people,
  me,
  nameOf,
}: {
  rota: Rota;
  people: readonly RotaPerson[];
  me: string | undefined;
  nameOf: NameOf;
}) {
  const schedule = useSchedule(rota.id, isoDay(new Date()), SHOWN_NIGHTS);
  const { askSwap } = useRotaActions();
  const [problem, setProblem] = useState<string | null>(null);
  const others = membersOf(rota, people).filter((userId) => userId !== me);
  const ask = async (night: string, toUserId: string): Promise<void> => {
    setProblem(await writeProblem(askSwap(rota, night, toUserId), 'The swap could not be asked for.'));
  };
  return (
    <section aria-label={`${rota.name}: the next two weeks`} className='grid gap-2'>
      <h3 className='text-sm font-medium text-muted-foreground'>The next two weeks</h3>
      <Problem problem={problem} />
      <ul className='grid gap-2 sm:grid-cols-2'>
        {(schedule.data ?? []).map((night) => (
          <li key={night.night} className='flex items-center justify-between gap-2 rounded-md border px-3 py-2'>
            <span className='grid'>
              <span className='text-sm font-medium'>{nightLabel(night.night)}</span>
              <span className='text-sm text-muted-foreground'>
                {nameOf(night.user_id)}
                {night.swapped && (
                  <Badge variant='secondary' className='ml-2'>
                    Swapped
                  </Badge>
                )}
              </span>
            </span>
            {night.user_id !== null && night.user_id === me && others.length > 0 && (
              <select
                aria-label={`Hand ${nightLabel(night.night)} to`}
                value={OPEN}
                onChange={(event) => void ask(night.night, event.target.value)}
                className={SELECT}
              >
                <option value={OPEN}>Swap…</option>
                {others.map((userId) => (
                  <option key={userId} value={userId}>
                    To {nameOf(userId)}
                  </option>
                ))}
              </select>
            )}
            {night.user_id !== null && night.user_id !== me && me !== undefined && (
              <Button variant='outline' size='sm' onClick={() => void ask(night.night, me)}>
                Ask for it
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Swaps waiting on you to answer, those waiting on the other person, and the last few answered. */
function Swaps({ rota, me, nameOf }: { rota: Rota; me: string | undefined; nameOf: NameOf }): ReactElement | null {
  const swaps = useSwaps(rota.id).data ?? [];
  const { answerSwap } = useRotaActions();
  const [problem, setProblem] = useState<string | null>(null);
  const mine = swaps.filter((swap) => swap.from_user_id === me || swap.to_user_id === me);
  if (mine.length === 0) {
    return null;
  }
  const answer = async (swap: Swap, accept: boolean): Promise<void> => {
    setProblem(await writeProblem(answerSwap(rota, swap, accept), 'Your answer could not be saved.'));
  };
  const other = (swap: Swap): string => nameOf(swap.from_user_id === me ? swap.to_user_id : swap.from_user_id);
  const what = (swap: Swap): string =>
    swap.from_user_id === me
      ? `${nightLabel(swap.night)}: from you to ${nameOf(swap.to_user_id)}`
      : `${nightLabel(swap.night)}: from ${nameOf(swap.from_user_id)} to you`;
  return (
    <section aria-label={`${rota.name}: swaps`} className='grid gap-2'>
      <h3 className='text-sm font-medium text-muted-foreground'>Swaps</h3>
      <Problem problem={problem} />
      <ul className='grid gap-2'>
        {mine.map((swap) => (
          <li key={swap.id} className='flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2'>
            <span className='text-sm'>{what(swap)}</span>
            {swap.status === 'pending' && swap.requested_by !== me && (
              <span className='flex gap-2'>
                <Button size='sm' onClick={() => void answer(swap, true)}>
                  Accept
                </Button>
                <Button size='sm' variant='outline' onClick={() => void answer(swap, false)}>
                  Decline
                </Button>
              </span>
            )}
            {swap.status === 'pending' && swap.requested_by === me && (
              <Badge variant='outline'>Waiting for {other(swap)}</Badge>
            )}
            {swap.status !== 'pending' && (
              <Badge variant={swap.status === 'accepted' ? 'secondary' : 'outline'}>
                {swap.status === 'accepted' ? 'Accepted' : 'Declined'}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The owner's cycle: whom each of its nights is with. */
function Cycle({ rota, people, nameOf }: { rota: Rota; people: readonly RotaPerson[]; nameOf: NameOf }): ReactElement {
  const { setNight } = useRotaActions();
  const [problem, setProblem] = useState<string | null>(null);
  const choices = membersOf(rota, people);
  const set = async (index: number, userId: string): Promise<void> => {
    setProblem(
      await writeProblem(setNight(rota, index, userId === OPEN ? null : userId), 'That night could not be changed.'),
    );
  };
  return (
    <details className='grid gap-2'>
      <summary className='cursor-pointer text-sm font-medium'>The cycle</summary>
      <Problem problem={problem} />
      <ul className='mt-2 grid gap-2'>
        {Array.from({ length: rota.cycle_days }, (_, index) => {
          const label = cycleNightLabel(rota, index);
          return (
            <li key={label} className='flex items-center justify-between gap-2'>
              <span className='text-sm'>{label}</span>
              <select
                aria-label={label}
                value={nightAt(rota, index)?.user_id ?? OPEN}
                onChange={(event) => void set(index, event.target.value)}
                className={SELECT}
              >
                <option value={OPEN}>Open</option>
                {choices.map((userId) => (
                  <option key={userId} value={userId}>
                    {nameOf(userId)}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function NewRota({ open }: { open: boolean }): ReactElement {
  const id = useId();
  const { create } = useRotaActions();
  const [name, setName] = useState('Nights');
  const [cycleDays, setCycleDays] = useState('7');
  const [startsOn, setStartsOn] = useState(isoDay(new Date()));
  const [problem, setProblem] = useState<string | null>(null);
  const submit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setProblem(
      await writeProblem(
        create({ name: name.trim(), cycle_days: Number(cycleDays), starts_on: startsOn }),
        'The rota could not be started.',
      ),
    );
  };
  return (
    <details open={open} className='rounded-md border p-4'>
      <summary className='cursor-pointer font-medium'>Start a rota</summary>
      <form onSubmit={(event) => void submit(event)} className='mt-4 grid gap-3 sm:grid-cols-3'>
        <label htmlFor={`${id}-name`} className='grid gap-1 text-sm font-medium'>
          Name
          <Input id={`${id}-name`} required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label htmlFor={`${id}-cycle`} className='grid gap-1 text-sm font-medium'>
          Nights before it repeats
          <Input
            id={`${id}-cycle`}
            type='number'
            required
            min={1}
            max={MAX_CYCLE_DAYS}
            value={cycleDays}
            onChange={(e) => setCycleDays(e.target.value)}
          />
        </label>
        <label htmlFor={`${id}-start`} className='grid gap-1 text-sm font-medium'>
          First night
          <Input id={`${id}-start`} type='date' required value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
        </label>
        <div className='sm:col-span-3'>
          <Problem problem={problem} />
          <Button type='submit'>Start the rota</Button>
        </div>
      </form>
    </details>
  );
}

/**
 * The nights rota: every rota you keep or have a night in, the next two weeks of each, the swaps
 * between you and someone else, and (for your own) the cycle. `people` names the accounts the app
 * knows, and offers them as nights' people. `wrapStart` wraps the form that starts a rota, for an
 * app that only lets some plans start one.
 */
export function RotaPage({
  people = [],
  wrapStart = (form) => form,
}: {
  people?: readonly RotaPerson[];
  wrapStart?: (form: ReactElement) => ReactNode;
}): ReactElement {
  const rotas = useMyRotas();
  const { me, nameOf } = useNames(people);
  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='grid gap-1'>
        <h1 className='text-3xl font-semibold'>Nights rota</h1>
        <p className='text-muted-foreground'>
          Who each night is with, on a cycle that repeats. A swap moves one night, once both of you agree.
        </p>
      </div>
      {rotas.error !== undefined && <Problem problem={`Your rotas could not be loaded: ${rotas.error.message}`} />}
      {rotas.data?.length === 0 && <p className='text-sm text-muted-foreground'>No rotas yet. Start one below.</p>}
      {(rotas.data ?? []).map((rota) => (
        <Card key={rota.id}>
          <CardHeader>
            <CardTitle>{rota.name}</CardTitle>
            <CardDescription>
              Every {String(rota.cycle_days)} night{rota.cycle_days === 1 ? '' : 's'}, from {nightLabel(rota.starts_on)}
              {rota.owner_id === me ? '' : ` · kept by ${nameOf(rota.owner_id)}`}
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-6'>
            <Swaps rota={rota} me={me} nameOf={nameOf} />
            <Schedule rota={rota} people={people} me={me} nameOf={nameOf} />
            {rota.owner_id === me && <Cycle rota={rota} people={people} nameOf={nameOf} />}
          </CardContent>
        </Card>
      ))}
      {rotas.data !== undefined && wrapStart(<NewRota open={rotas.data.length === 0} />)}
    </main>
  );
}
