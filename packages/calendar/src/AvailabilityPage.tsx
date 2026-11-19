// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { ChoiceChip } from 'zephyrex/ui/choice-chip';
import { chipGroup } from 'zephyrex/hooks/chipKeys';
import { type ReactElement, type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useClient, useUser, writeProblem } from 'zephyrex';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'zephyrex/ui/dialog';
import { Input } from 'zephyrex/ui/input';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import { Switch } from 'zephyrex/ui/switch';
import { calendarApi, useAvailabilityShares, useCalendarAccounts, useSharedWithMe } from './calendarApi';
import {
  type Booked,
  browserZone,
  CALENDAR_SERVICES,
  type CalendarPerson,
  type CalendarService,
  type FreeSlot,
  type FreeTime,
  serviceLabel,
  slotLabel,
} from './calendarModel';

const LINK = 'underline underline-offset-4';
const NOBODY = '';
const DEFAULT_ACCOUNT_PAGE = '/user/manage';
/** How long a date lasts, and how many days ahead to look, by default. */
const DEFAULT_MINUTES = 120;
const DEFAULT_DAYS = 7;
const MAX_DAYS = 31;
const LENGTHS = [
  { minutes: 60, label: '1 hour' },
  { minutes: 120, label: '2 hours' },
  { minutes: 180, label: '3 hours' },
  { minutes: 240, label: '4 hours' },
];
const MS_PER_DAY = 86_400_000;
/** How far ahead to look, one tap each. */
const SPANS = [
  { days: 3, label: 'Next 3 days' },
  { days: 7, label: 'A week' },
  { days: 14, label: 'Two weeks' },
];
/** The part of the day to look in, one tap each; any other window is typed below. */
const WINDOWS = [
  { start: '18:00', end: '23:00', label: 'Evenings' },
  { start: '09:00', end: '17:00', label: 'Daytime' },
  { start: '08:00', end: '23:00', label: 'Any time' },
];
const CHIP =
  'rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground';

type NameOf = (userId: string) => string;

const timeOf = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function Problem({ problem }: { problem: string | null }): ReactNode {
  return problem === null ? null : (
    <p role='alert' className='text-sm text-destructive'>
      {problem}
    </p>
  );
}

/** A YYYY-MM-DD day in local time, `offset` days from today. */
function dayFromToday(offset: number): string {
  const day = new Date(Date.now() + offset * MS_PER_DAY);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${String(day.getFullYear())}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

function YourCalendars({ accountPage }: { accountPage: string }): ReactNode {
  const client = useClient();
  const ids = { service: useId(), label: useId(), url: useId(), user: useId(), password: useId(), calendar: useId() };
  const accounts = useCalendarAccounts();
  const [service, setService] = useState<CalendarService>('caldav');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // With a calendar connected, connecting another is a choice, not the page: the form folds away.
  const [adding, setAdding] = useState(false);
  const connected = (accounts.data ?? []).length > 0;
  const formShown = !connected || adding;
  const delegated = service !== 'caldav';
  const run = (write: Promise<unknown>, fallback: string, after?: () => void): void => {
    setBusy(true);
    void (async (): Promise<void> => {
      const failed = await writeProblem(write, fallback);
      setProblem(failed);
      if (failed === null) {
        after?.();
      }
      await accounts.mutate();
      setBusy(false);
    })();
  };
  const connect = (event: SyntheticEvent): void => {
    event.preventDefault();
    run(
      calendarApi.connect(client, {
        provider: service,
        label: label.trim() === '' ? serviceLabel(service) : label.trim(),
        ...(delegated
          ? calendarId.trim() === ''
            ? {}
            : { calendar_id: calendarId.trim() }
          : { calendar_url: url.trim(), username: username.trim(), password }),
      }),
      'The calendar could not be connected.',
      () => {
        setLabel('');
        setPassword('');
        setAdding(false);
      },
    );
  };
  return (
    <div className='grid gap-4'>
      {accounts.error !== undefined && <Problem problem={accounts.error.message} />}
      {accounts.error === undefined && accounts.data === undefined && (
        <SkeletonRows rows={2} label='Loading your calendars' />
      )}
      {accounts.data?.length === 0 && <p className='text-sm text-muted-foreground'>No calendars connected yet.</p>}
      {(accounts.data ?? []).length > 0 && (
        <ul aria-label='Your calendars' className='divide-y'>
          {(accounts.data ?? []).map((account) => (
            <li key={account.id} className='flex flex-wrap items-center justify-between gap-2 py-2'>
              <span>
                <span className='font-medium'>{account.label}</span>
                <span className='text-sm text-muted-foreground'> · {serviceLabel(account.provider)}</span>
              </span>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                disabled={busy}
                aria-label={`Disconnect ${account.label}`}
                onClick={() => run(calendarApi.disconnect(client, account), 'The calendar could not be disconnected.')}
              >
                Disconnect
              </Button>
            </li>
          ))}
        </ul>
      )}
      {connected && !formShown && (
        <Button type='button' variant='outline' className='justify-self-start' onClick={() => setAdding(true)}>
          Connect another calendar
        </Button>
      )}
      {formShown && (
        <form
          onSubmit={connect}
          aria-label='Connect a calendar'
          className='grid gap-3 rounded-md border p-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2'
        >
          <fieldset className='col-span-full grid min-w-0 gap-1.5'>
            <legend id={ids.service} className='mb-1.5 text-sm font-medium'>
              Calendar
            </legend>
            <div className='flex flex-wrap gap-1.5' ref={chipGroup}>
              {CALENDAR_SERVICES.map((item) => (
                <button
                  key={item.provider}
                  type='button'
                  aria-pressed={service === item.provider}
                  onClick={() => setService(item.provider)}
                  className={CHIP}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label htmlFor={ids.label} className='grid gap-1 text-sm font-medium'>
            Call it (optional)
            <Input
              id={ids.label}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder='Personal'
              maxLength={200}
            />
          </label>
          {delegated ? (
            <>
              {service === 'google_calendar' && (
                <label htmlFor={ids.calendar} className='grid gap-1 text-sm font-medium'>
                  Which calendar (optional)
                  <Input
                    id={ids.calendar}
                    value={calendarId}
                    onChange={(event) => setCalendarId(event.target.value)}
                    placeholder='primary'
                    maxLength={200}
                  />
                </label>
              )}
              <p className='text-sm text-muted-foreground col-span-full'>
                Uses the account you linked on{' '}
                <a className={LINK} href={accountPage}>
                  your account page
                </a>
                . Link it there first, allowing calendar access.
              </p>
            </>
          ) : (
            <>
              <label htmlFor={ids.url} className='grid gap-1 text-sm font-medium col-span-full'>
                Calendar address
                <Input
                  id={ids.url}
                  type='url'
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder='https://caldav.example.com/calendars/you/personal/'
                  required
                  maxLength={2000}
                  autoCapitalize='off'
                  autoCorrect='off'
                  spellCheck={false}
                />
              </label>
              <label htmlFor={ids.user} className='grid gap-1 text-sm font-medium'>
                Sign-in name
                <Input
                  id={ids.user}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  maxLength={200}
                  autoComplete='off'
                  autoCapitalize='off'
                  spellCheck={false}
                />
              </label>
              <label htmlFor={ids.password} className='grid gap-1 text-sm font-medium'>
                App password
                <Input
                  id={ids.password}
                  type='password'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  maxLength={200}
                  autoComplete='off'
                />
              </label>
            </>
          )}
          <div className='grid gap-2 col-span-full'>
            <Problem problem={problem} />
            <div className='flex flex-wrap gap-2'>
              <Button type='submit' disabled={busy}>
                {busy ? 'Connecting…' : 'Connect'}
              </Button>
              {connected && (
                <Button type='button' variant='ghost' disabled={busy} onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function ShareAvailability({ people, nameOf }: { people: readonly CalendarPerson[]; nameOf: NameOf }): ReactNode {
  const client = useClient();
  const pickerId = useId();
  const bookId = useId();
  const shares = useAvailabilityShares();
  const [chosen, setChosen] = useState(NOBODY);
  const [canBook, setCanBook] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sharedWith = new Set((shares.data ?? []).map((share) => share.user_id));
  const offered = people.filter((person) => !sharedWith.has(person.userId));
  const run = (write: Promise<unknown>, fallback: string): void => {
    setBusy(true);
    void (async (): Promise<void> => {
      setProblem(await writeProblem(write, fallback));
      await shares.mutate();
      setBusy(false);
    })();
  };
  return (
    <div className='grid gap-3'>
      <div className='flex flex-wrap items-end gap-3'>
        <div role='radiogroup' aria-labelledby={pickerId} className='grid gap-1.5'>
          <span id={pickerId} className='text-sm font-medium'>
            Share with
          </span>
          {offered.length === 0 ? (
            <span className='text-sm text-muted-foreground'>
              {people.length === 0
                ? 'Nobody in your tree has an account here yet. Once someone does, you can share with them here.'
                : 'Everyone you could share with already sees it.'}
            </span>
          ) : (
            <div className='flex flex-wrap gap-2' ref={chipGroup}>
              {offered.map((person) => (
                <ChoiceChip
                  key={person.userId}
                  checked={chosen === person.userId}
                  onClick={() => setChosen(chosen === person.userId ? NOBODY : person.userId)}
                  className={`${CHIP} aria-checked:border-primary aria-checked:bg-primary/10 aria-checked:text-foreground`}
                >
                  {person.name}
                </ChoiceChip>
              ))}
            </div>
          )}
        </div>
        {offered.length > 0 && (
          <>
            <label htmlFor={bookId} className='flex h-9 items-center gap-2 text-sm'>
              <Switch id={bookId} checked={canBook} onCheckedChange={setCanBook} />
              They may book dates into my calendar
            </label>
            <Button
              type='button'
              disabled={chosen === NOBODY || busy}
              onClick={() => {
                run(calendarApi.share(client, chosen, canBook), 'Your availability could not be shared.');
                setChosen(NOBODY);
                setCanBook(false);
              }}
            >
              Share
            </Button>
          </>
        )}
      </div>
      <Problem problem={problem} />
      {shares.data?.length === 0 && <p className='text-sm text-muted-foreground'>Nobody sees when you are busy yet.</p>}
      {(shares.data ?? []).length > 0 && (
        <ul aria-label='Sharing with' className='divide-y'>
          {(shares.data ?? []).map((share) => (
            <li key={share.user_id} className='flex flex-wrap items-center justify-between gap-2 py-2'>
              <span>{nameOf(share.user_id)}</span>
              <span className='flex items-center gap-3'>
                <label htmlFor={`${bookId}-${share.user_id}`} className='flex items-center gap-2 text-sm'>
                  <Switch
                    id={`${bookId}-${share.user_id}`}
                    checked={share.can_book}
                    disabled={busy}
                    onCheckedChange={(on) => run(calendarApi.share(client, share.user_id, on), 'That could not be saved.')}
                  />
                  May book
                </label>
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  disabled={busy}
                  aria-label={`Stop sharing with ${nameOf(share.user_id)}`}
                  onClick={() => run(calendarApi.unshare(client, share.user_id), 'Sharing could not be stopped.')}
                >
                  Stop sharing
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookSlot({
  slot,
  people,
  nameOf,
  onBooked,
}: {
  slot: FreeSlot;
  people: readonly string[];
  nameOf: NameOf;
  onBooked: (booked: Booked) => void;
}): ReactNode {
  const client = useClient();
  const titleId = useId();
  const placeId = useId();
  const [title, setTitle] = useState('Date');
  const [location, setLocation] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const book = (event: SyntheticEvent): void => {
    event.preventDefault();
    setBusy(true);
    void (async (): Promise<void> => {
      const booking = calendarApi.book(client, {
        title: title.trim(),
        start: slot.start,
        end: slot.end,
        ...(location.trim() === '' ? {} : { location: location.trim() }),
        user_ids: [...people],
      });
      const failed = await writeProblem(booking, 'The date could not be booked.');
      setProblem(failed);
      setBusy(false);
      if (failed === null) {
        onBooked(await booking);
      }
    })();
  };
  return (
    <form onSubmit={book} aria-label={`Book ${slotLabel(slot)}`} className='grid gap-3'>
      <label htmlFor={titleId} className='grid gap-1 text-sm font-medium'>
        What
        <Input id={titleId} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} />
      </label>
      <label htmlFor={placeId} className='grid gap-1 text-sm font-medium'>
        Where (optional)
        <Input id={placeId} value={location} onChange={(event) => setLocation(event.target.value)} maxLength={200} />
      </label>
      <p className='text-sm text-muted-foreground'>
        Goes into your calendar
        {people.length > 0 ? ` and those of ${people.map(nameOf).join(', ')} who let you book them` : ''}.
      </p>
      <Problem problem={problem} />
      <Button type='submit' className='justify-self-start' disabled={busy || title.trim() === ''}>
        {busy ? 'Booking…' : 'Book it'}
      </Button>
    </form>
  );
}

/** "a", "a and b", "a, b and c". */
function listed(items: readonly string[]): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1) ?? ''}`;
}

/** Where a booking went, in words: "Booked into your and Alex’s calendars. Tell Jo yourself: …". */
export function bookedMessage(booked: Booked, me: string | undefined, nameOf: NameOf): string {
  const whose = (userId: string): string => (userId === me ? 'your' : `${nameOf(userId)}’s`);
  const calendars = (ids: readonly string[]): string =>
    `${listed(ids.map(whose))} ${ids.length === 1 ? 'calendar' : 'calendars'}`;
  const parts = [booked.booked.length > 0 ? `Booked into ${calendars(booked.booked)}.` : 'Not booked into any calendar.'];
  if (me !== undefined && booked.not_booked.includes(me)) {
    parts.push('Connect a calendar of your own to have it booked there too.');
  }
  const others = booked.not_booked.filter((userId) => userId !== me);
  if (others.length > 0) {
    parts.push(`Tell ${listed(others.map(nameOf))} yourself: they don’t let you book them, or have no calendar connected.`);
  }
  if (booked.failed.length > 0) {
    const refused = calendars(booked.failed);
    parts.push(`${refused.charAt(0).toUpperCase()}${refused.slice(1)} refused it.`);
  }
  return parts.join(' ');
}

function FindATime({ nameOf }: { nameOf: NameOf }): ReactNode {
  const client = useClient();
  const me = useUser().data?.id;
  const ids = { from: useId(), days: useId(), length: useId(), start: useId(), end: useId() };
  const sharing = useSharedWithMe();
  // Everyone who shares with you is in by default, so the first search already counts them.
  const [picked, setWho] = useState<readonly string[] | null>(null);
  const who = picked ?? (sharing.data ?? []).map((share) => share.user_id);
  const [firstDay, setFirstDay] = useState(dayFromToday(0));
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [dayStart, setDayStart] = useState('18:00');
  const [dayEnd, setDayEnd] = useState('23:00');
  const [found, setFound] = useState<FreeTime | null>(null);
  const [chosen, setChosen] = useState<FreeSlot | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toggle = (userId: string, on: boolean): void => {
    setWho(on ? [...who.filter((id) => id !== userId), userId] : who.filter((id) => id !== userId));
  };
  const search = (event: SyntheticEvent): void => {
    event.preventDefault();
    setBusy(true);
    setChosen(null);
    setBooked(null);
    void (async (): Promise<void> => {
      const finding = calendarApi.findFree(client, {
        user_ids: [...who],
        first_day: firstDay,
        days,
        duration_minutes: minutes,
        day_start: dayStart,
        day_end: dayEnd,
        timezone: browserZone(),
      });
      const failed = await writeProblem(finding, 'Free times could not be found.');
      setProblem(failed);
      setFound(failed === null ? await finding : null);
      setBusy(false);
    })();
  };
  const unread = (found?.people ?? []).filter((person) => person.unreadable > 0 || person.calendars === 0);
  return (
    <div className='grid gap-4'>
      <form onSubmit={search} aria-label='Find a time' className='grid gap-3'>
        <fieldset className='grid gap-2'>
          <legend className='mb-1 text-sm font-medium'>With</legend>
          {sharing.data?.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              Nobody shares when they are busy with you yet; you can still find your own free time.
            </p>
          )}
          <div className='flex flex-wrap gap-2' ref={chipGroup}>
            {(sharing.data ?? []).map((share) => {
              const on = who.includes(share.user_id);
              return (
                <button
                  key={share.user_id}
                  type='button'
                  aria-pressed={on}
                  onClick={() => toggle(share.user_id, !on)}
                  className={`${CHIP} flex items-center gap-2 py-1 pl-1`}
                >
                  <span
                    aria-hidden='true'
                    className='inline-flex size-6 items-center justify-center rounded-full bg-primary/20 text-[0.65rem] font-semibold text-foreground'
                  >
                    {nameOf(share.user_id).charAt(0)}
                  </span>
                  {nameOf(share.user_id)}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className='grid gap-3 sm:grid-cols-2'>
          <fieldset aria-label='How far ahead' className='min-w-0 grid gap-1.5'>
            <span className='text-sm font-medium'>How far ahead</span>
            <div className='flex flex-wrap items-center gap-2' ref={chipGroup}>
              {SPANS.map((span) => (
                <button
                  key={span.days}
                  type='button'
                  aria-pressed={days === span.days}
                  onClick={() => setDays(span.days)}
                  className={CHIP}
                >
                  {span.label}
                </button>
              ))}
              {/* Or any number of days: the chips set the same value. */}
              <span className='inline-flex items-center gap-1.5 text-sm text-muted-foreground'>
                <Input
                  id={ids.days}
                  type='number'
                  aria-label='Days'
                  min={1}
                  max={MAX_DAYS}
                  value={days}
                  onChange={(event) => setDays(Math.max(1, Math.min(MAX_DAYS, Number(event.target.value) || 1)))}
                  className='h-8 w-16 tabular-nums'
                />
                days
              </span>
            </div>
          </fieldset>
          <fieldset aria-label='For how long' className='min-w-0 grid gap-1.5'>
            <span className='text-sm font-medium'>For how long</span>
            <div className='flex flex-wrap items-center gap-2' ref={chipGroup}>
              {LENGTHS.map((length) => (
                <button
                  key={length.minutes}
                  type='button'
                  aria-pressed={minutes === length.minutes}
                  onClick={() => setMinutes(length.minutes)}
                  className={CHIP}
                >
                  {length.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset aria-label='When in the day' className='min-w-0 grid gap-1.5 sm:col-span-2'>
            <span className='text-sm font-medium'>When in the day</span>
            <div className='flex flex-wrap items-center gap-2' ref={chipGroup}>
              {WINDOWS.map((span) => (
                <button
                  key={span.label}
                  type='button'
                  aria-pressed={dayStart === span.start && dayEnd === span.end}
                  onClick={() => {
                    setDayStart(span.start);
                    setDayEnd(span.end);
                  }}
                  className={CHIP}
                >
                  {span.label}
                </button>
              ))}
              <span className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                <label htmlFor={ids.start} className='sr-only'>
                  Between
                </label>
                <Input
                  id={ids.start}
                  type='time'
                  value={dayStart}
                  onChange={(event) => setDayStart(event.target.value)}
                  required
                  className='h-8 w-28'
                />
                to
                <label htmlFor={ids.end} className='sr-only'>
                  And
                </label>
                <Input
                  id={ids.end}
                  type='time'
                  value={dayEnd}
                  onChange={(event) => setDayEnd(event.target.value)}
                  required
                  className='h-8 w-28'
                />
              </span>
            </div>
          </fieldset>
        </div>
        <div className='flex flex-wrap items-end gap-3'>
          <label htmlFor={ids.from} className='grid gap-1 text-sm font-medium'>
            Starting
            <Input
              id={ids.from}
              type='date'
              value={firstDay}
              min={dayFromToday(0)}
              onChange={(event) => setFirstDay(event.target.value)}
              required
            />
          </label>
          <Button type='submit' disabled={busy}>
            {busy ? 'Looking…' : 'Find free times'}
          </Button>
        </div>
        <Problem problem={problem} />
      </form>
      {unread.length > 0 && (
        <p
          role='note'
          className='flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm'
        >
          <span aria-hidden='true' className='text-amber-500'>
            ⚠
          </span>
          <span>
            Not counted: {unread.map((person) => nameOf(person.user_id)).join(', ')} (no calendar connected, or it did not
            answer), so those busy times are not ruled out.
          </span>
          <a href='#your-calendars' className='font-medium underline underline-offset-4'>
            Connect a calendar
          </a>
        </p>
      )}
      {found?.slots.length === 0 && (
        <p className='text-sm text-muted-foreground'>No time when everyone is free. Try more days or a shorter date.</p>
      )}
      {booked !== null && (
        <p role='status' className='text-sm'>
          {booked}
        </p>
      )}
      {(found?.slots ?? []).length > 0 && (
        <ul aria-label='Free times' className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {byDay(found?.slots ?? []).map(([day, slots]) => (
            <li key={day} className='grid content-start gap-2 rounded-lg border p-3'>
              <span className='text-sm font-semibold'>{day}</span>
              <ul className='flex flex-wrap gap-1.5 sm:grid'>
                {slots.map((slot) => (
                  <li key={slot.start} className='sm:grid'>
                    <button
                      type='button'
                      onClick={() => setChosen(slot)}
                      aria-label={`Book ${slotLabel(slot)}`}
                      aria-pressed={chosen?.start === slot.start}
                      className='flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-1.5 text-sm tabular-nums hover:border-primary/60 aria-pressed:border-primary aria-pressed:bg-primary/10 sm:w-full'
                    >
                      {timeOf(slot.start)} – {timeOf(slot.end)}
                      <span className='hidden text-xs text-primary sm:inline'>Book</span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {/* Booking a slot opens over the results (a bottom sheet on a phone), not squeezed into its day. */}
      <Dialog open={chosen !== null} onOpenChange={(open) => !open && setChosen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book {chosen === null ? '' : slotLabel(chosen)}</DialogTitle>
            <DialogDescription>Name it, and add where if you know.</DialogDescription>
          </DialogHeader>
          {chosen !== null && (
            <BookSlot
              slot={chosen}
              people={who}
              nameOf={nameOf}
              onBooked={(result) => {
                setChosen(null);
                setBooked(bookedMessage(result, me, nameOf));
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** A slot's clock time in the user's own zone ("19:30"). */

/** Free slots grouped under their day ("Fri 7 Nov"), in order. */
function byDay(slots: readonly FreeSlot[]): [string, FreeSlot[]][] {
  const days = new Map<string, FreeSlot[]>();
  for (const slot of slots) {
    const day = new Date(slot.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    days.set(day, [...(days.get(day) ?? []), slot]);
  }
  return [...days.entries()];
}

export interface AvailabilityPageProps {
  /** The accounts the app knows, to share with and find time with. */
  people?: readonly CalendarPerson[];
  /** Where the user links Google or Microsoft. */
  accountPage?: string;
  /** Wraps finding and booking a time, for an app that only lets some plans do it. */
  wrapFind?: (finder: ReactElement) => ReactNode;
}

/** Your calendars, who sees when you are busy, and finding and booking a time together. */
export function AvailabilityPage({
  people = [],
  accountPage = DEFAULT_ACCOUNT_PAGE,
  wrapFind = (finder) => finder,
}: AvailabilityPageProps): ReactNode {
  const me = useUser().data?.id;
  const nameOf: NameOf = (userId) =>
    userId === me ? 'You' : (people.find((person) => person.userId === userId)?.name ?? 'Someone');
  return (
    <div className='grid gap-6'>
      <div className='grid gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>Shared availability</h1>
        <p className='text-muted-foreground'>
          When everyone is free, and a date booked into all your calendars. Only busy times are shared, never what they are.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Find a time together</CardTitle>
          <CardDescription>The times you and the people you choose are all free.</CardDescription>
        </CardHeader>
        <CardContent>{wrapFind(<FindATime nameOf={nameOf} />)}</CardContent>
      </Card>
      {/* The setup, side by side on a wide screen: where busy times come from, and who sees them. */}
      <div className='grid items-start gap-6 xl:grid-cols-2'>
        <Card id='your-calendars' className='scroll-mt-6'>
          <CardHeader>
            <CardTitle>Your calendars</CardTitle>
            <CardDescription>Where your busy times come from, and where dates are booked.</CardDescription>
          </CardHeader>
          <CardContent>
            <YourCalendars accountPage={accountPage} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Who sees when you are busy</CardTitle>
            <CardDescription>They see busy or free, never what you are doing.</CardDescription>
          </CardHeader>
          <CardContent>
            <ShareAvailability people={people} nameOf={nameOf} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
