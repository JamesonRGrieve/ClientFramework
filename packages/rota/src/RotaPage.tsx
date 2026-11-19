// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { ChoiceChip } from 'zephyrex/ui/choice-chip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'zephyrex/ui/dropdown-menu';
import { chipGroup } from 'zephyrex/hooks/chipKeys';
import { LoadProblem } from 'zephyrex/ui/load-problem';
import { type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useUser, writeProblem } from 'zephyrex';
import { notify } from 'zephyrex/hooks/useToast';
import { Badge } from 'zephyrex/ui/badge';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'zephyrex/ui/dialog';
import { Input } from 'zephyrex/ui/input';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import { useMyRotas, useRotaActions, useSchedule, useSwaps } from './rotaApi';
import {
  cycleNightLabel,
  isoDay,
  MAX_CYCLE_DAYS,
  membersOf,
  nightAt,
  nightLabel,
  dayOf,
  type Rota,
  type RotaPerson,
  type Swap,
} from './rotaModel';

/** How many nights ahead the schedule shows. */
const SHOWN_NIGHTS = 14;
const SELECT = 'h-9 rounded-md border bg-background px-3 text-sm font-normal';
const OPEN = '';
const HUES = 360;
const HUE_SEED = 31;
/** Up to this many people, a cycle night is chosen with chips; more, with a list. */
const CHIP_MAX = 3;

/** A stable colour per account, so each person's nights read at a glance. */
function hueOf(userId: string): number {
  let hash = 0;
  for (const char of userId) {
    hash = (hash * HUE_SEED + (char.codePointAt(0) ?? 0)) % HUES;
  }
  return hash;
}

/** Common cycle lengths, one tap each. */
const CYCLE_PRESETS: readonly { days: number; label: string }[] = [
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 28, label: '4 weeks' },
];

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
    const failed = await writeProblem(askSwap(rota, night, toUserId), 'The swap could not be asked for.');
    setProblem(failed);
    if (failed === null) {
      notify('Swap asked for', `${nameOf(toUserId)} answers it.`);
    }
  };
  return (
    <section aria-label={`${rota.name}: the next two weeks`} className='grid gap-2'>
      <h3 className='text-sm font-medium text-muted-foreground'>The next two weeks</h3>
      <Problem problem={problem} />
      <ol className='grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7'>
        {(schedule.data ?? []).map((night) => {
          const mine = night.user_id !== null && night.user_id === me;
          const day = dayOf(night.night);
          const today = day.toDateString() === new Date().toDateString();
          return (
            <li
              key={night.night}
              aria-label={`${nightLabel(night.night)}: ${nameOf(night.user_id)}`}
              aria-current={today ? 'date' : undefined}
              className={`group grid content-start gap-2 rounded-lg border p-2 ${mine ? 'border-primary/50 bg-primary/10' : 'bg-muted/20'} ${today ? 'ring-2 ring-primary/70' : ''}`}
            >
              <span className='flex items-baseline justify-between gap-1'>
                <span
                  className={`text-xs uppercase tracking-wide ${today ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                >
                  {today ? 'Today' : day.toLocaleDateString('en-GB', { weekday: 'short' })}
                </span>
                <span className='text-lg font-semibold tabular-nums'>{String(day.getDate())}</span>
              </span>
              <span className='flex items-center gap-1.5 text-sm'>
                <span
                  aria-hidden='true'
                  className='inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-semibold text-white'
                  style={{
                    backgroundColor:
                      night.user_id === null ? 'hsl(0 0% 40%)' : `hsl(${String(hueOf(night.user_id))} 55% 30%)`,
                  }}
                >
                  {nameOf(night.user_id).charAt(0)}
                </span>
                <span className='truncate font-medium'>{nameOf(night.user_id)}</span>
              </span>
              {night.swapped && (
                <Badge variant='secondary' className='justify-self-start text-[0.65rem]'>
                  Swapped
                </Badge>
              )}
              {mine && others.length === 1 && (
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 text-xs transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100'
                  aria-label={`Offer to ${nameOf(others[0] ?? '').split(' ')[0] ?? ''}: ${nightLabel(night.night)}`}
                  onClick={() => void ask(night.night, others[0] ?? OPEN)}
                >
                  Offer to {nameOf(others[0] ?? '').split(' ')[0]}
                </Button>
              )}
              {mine && others.length > 1 && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-7 text-xs transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100 data-[state=open]:opacity-100'
                      aria-label={`Offer to someone: ${nightLabel(night.night)}`}
                    >
                      Offer to… <span aria-hidden='true'>▾</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='start'>
                    {others.map((userId) => (
                      <DropdownMenuItem key={userId} className='gap-2' onSelect={() => void ask(night.night, userId)}>
                        <span
                          aria-hidden='true'
                          className='inline-flex size-5 items-center justify-center rounded-full text-[0.6rem] font-semibold text-white'
                          style={{ backgroundColor: `hsl(${String(hueOf(userId))} 55% 30%)` }}
                        >
                          {nameOf(userId).charAt(0)}
                        </span>
                        {nameOf(userId)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {night.user_id !== null && !mine && me !== undefined && (
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 text-xs transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100'
                  onClick={() => void ask(night.night, me)}
                >
                  Ask for it
                </Button>
              )}
            </li>
          );
        })}
      </ol>
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
    const failed = await writeProblem(answerSwap(rota, swap, accept), 'Your answer could not be saved.');
    setProblem(failed);
    if (failed === null) {
      notify(accept ? 'Swap accepted' : 'Swap declined');
    }
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
              {choices.length <= CHIP_MAX ? (
                <div role='radiogroup' aria-label={label} className='inline-flex rounded-full border p-0.5'>
                  <div className='contents' ref={chipGroup}>
                    {[OPEN, ...choices].map((userId) => {
                      const chosen = (nightAt(rota, index)?.user_id ?? OPEN) === userId;
                      return (
                        <ChoiceChip
                          key={userId}
                          checked={chosen}
                          onClick={() => void set(index, userId)}
                          className='flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors aria-checked:bg-primary aria-checked:text-primary-foreground'
                        >
                          {userId === OPEN ? 'Open' : nameOf(userId).split(' ')[0]}
                        </ChoiceChip>
                      );
                    })}
                  </div>
                </div>
              ) : (
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
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/** The form that starts a rota; `compact` stacks its fields (in a dialog), and `onDone` runs once it is started. */
function NewRotaForm({ compact = false, onDone }: { compact?: boolean; onDone?: () => void }): ReactElement {
  const id = useId();
  const { create } = useRotaActions();
  const [name, setName] = useState('Nights');
  const [cycleDays, setCycleDays] = useState('7');
  const [startsOn, setStartsOn] = useState(isoDay(new Date()));
  const [problem, setProblem] = useState<string | null>(null);
  const submit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const failed = await writeProblem(
      create({ name: name.trim(), cycle_days: Number(cycleDays), starts_on: startsOn }),
      'The rota could not be started.',
    );
    setProblem(failed);
    if (failed === null) {
      notify('Rota started', name.trim());
      onDone?.();
    }
  };
  return (
    <form onSubmit={(event) => void submit(event)} className={compact ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-3'}>
      <label htmlFor={`${id}-name`} className='grid gap-1 text-sm font-medium'>
        Name
        <Input id={`${id}-name`} required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className='grid gap-1 text-sm font-medium'>
        <label htmlFor={`${id}-cycle`}>Nights before it repeats</label>
        <div className='flex flex-wrap items-center gap-1.5' ref={chipGroup}>
          {CYCLE_PRESETS.map((preset) => (
            <button
              key={preset.days}
              type='button'
              aria-pressed={Number(cycleDays) === preset.days}
              onClick={() => setCycleDays(String(preset.days))}
              className='rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground'
            >
              {preset.label}
            </button>
          ))}
          <Input
            id={`${id}-cycle`}
            type='number'
            required
            min={1}
            max={MAX_CYCLE_DAYS}
            value={cycleDays}
            onChange={(e) => setCycleDays(e.target.value)}
            className='h-8 w-16'
          />
        </div>
      </div>
      <label htmlFor={`${id}-start`} className='grid gap-1 text-sm font-medium'>
        First night
        <Input id={`${id}-start`} type='date' required value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
      </label>
      <div className='col-span-full grid gap-2'>
        <Problem problem={problem} />
        <Button type='submit' className='justify-self-start'>
          Start the rota
        </Button>
      </div>
    </form>
  );
}

const NEW_ROTA_HELP = 'Name it, choose how long before it repeats, and when the first night is.';

/** The first run: the form in a card, since there is no rota yet to show. */
function FirstRota(): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start your first rota</CardTitle>
        <CardDescription>{NEW_ROTA_HELP}</CardDescription>
      </CardHeader>
      <CardContent>
        <NewRotaForm />
      </CardContent>
    </Card>
  );
}

/** Once there is a rota, starting another is an action in the header, not a form under the rotas. */
function NewRotaAction({ wrapStart }: { wrapStart: (form: ReactElement) => ReactNode }): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>New rota</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start another rota</DialogTitle>
          <DialogDescription>{NEW_ROTA_HELP}</DialogDescription>
        </DialogHeader>
        {wrapStart(<NewRotaForm compact onDone={() => setOpen(false)} />)}
      </DialogContent>
    </Dialog>
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
    <main className='mx-auto flex w-full max-w-5xl flex-col gap-6 2xl:max-w-none'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='grid gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>Nights rota</h1>
          <p className='text-muted-foreground'>
            Who each night is with, on a cycle that repeats. A swap moves one night, once both of you agree.
          </p>
        </div>
        {(rotas.data?.length ?? 0) > 0 && <NewRotaAction wrapStart={wrapStart} />}
      </div>
      {rotas.error !== undefined && (
        <LoadProblem what='your rotas' error={rotas.error} onRetry={async () => rotas.mutate()} />
      )}
      {rotas.error === undefined && rotas.data === undefined && <SkeletonRows rows={3} label='Loading your rotas' />}
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
      {rotas.data?.length === 0 && wrapStart(<FirstRota />)}
    </main>
  );
}
