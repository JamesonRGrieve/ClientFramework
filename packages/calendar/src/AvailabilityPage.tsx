// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactNode, type SyntheticEvent, useId, useState } from 'react';
import { useClient, useUser, writeProblem } from 'zephyrex';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Input } from 'zephyrex/ui/input';
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

const SELECT = 'h-9 rounded-md border bg-background px-3 text-sm font-normal';
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

type NameOf = (userId: string) => string;

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
      },
    );
  };
  return (
    <div className='grid gap-4'>
      {accounts.error !== undefined && <Problem problem={accounts.error.message} />}
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
      <form onSubmit={connect} aria-label='Connect a calendar' className='grid gap-3 rounded-md border p-4 sm:grid-cols-2'>
        <label htmlFor={ids.service} className='grid gap-1 text-sm font-medium'>
          Calendar
          <select
            id={ids.service}
            value={service}
            onChange={(event) =>
              setService(CALENDAR_SERVICES.find((item) => item.provider === event.target.value)?.provider ?? 'caldav')
            }
            className={SELECT}
          >
            {CALENDAR_SERVICES.map((item) => (
              <option key={item.provider} value={item.provider}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
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
            <p className='text-sm text-muted-foreground sm:col-span-2'>
              Uses the account you linked on{' '}
              <a className={LINK} href={accountPage}>
                your account page
              </a>
              . Link it there first, allowing calendar access.
            </p>
          </>
        ) : (
          <>
            <label htmlFor={ids.url} className='grid gap-1 text-sm font-medium sm:col-span-2'>
              Calendar address
              <Input
                id={ids.url}
                type='url'
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder='https://caldav.example.com/calendars/you/personal/'
                required
                maxLength={2000}
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
        <div className='grid gap-2 sm:col-span-2'>
          <Problem problem={problem} />
          <Button type='submit' className='justify-self-start' disabled={busy}>
            {busy ? 'Connecting…' : 'Connect'}
          </Button>
        </div>
      </form>
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
        <label htmlFor={pickerId} className='grid min-w-56 gap-1 text-sm font-medium'>
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
        <label htmlFor={bookId} className='flex h-9 items-center gap-2 text-sm'>
          <input id={bookId} type='checkbox' checked={canBook} onChange={(event) => setCanBook(event.target.checked)} />
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
      </div>
      <Problem problem={problem} />
      {shares.data?.length === 0 && <p className='text-sm text-muted-foreground'>Nobody sees when you are busy yet.</p>}
      {(shares.data ?? []).length > 0 && (
        <ul aria-label='Sharing with' className='divide-y'>
          {(shares.data ?? []).map((share) => (
            <li key={share.user_id} className='flex flex-wrap items-center justify-between gap-2 py-2'>
              <span>{nameOf(share.user_id)}</span>
              <span className='flex items-center gap-3'>
                <label className='flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={share.can_book}
                    disabled={busy}
                    onChange={(event) =>
                      run(calendarApi.share(client, share.user_id, event.target.checked), 'That could not be saved.')
                    }
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
    <form
      onSubmit={book}
      aria-label={`Book ${slotLabel(slot)}`}
      className='grid gap-2 rounded-md bg-muted p-3 sm:grid-cols-2'
    >
      <label htmlFor={titleId} className='grid gap-1 text-sm font-medium'>
        What
        <Input id={titleId} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} />
      </label>
      <label htmlFor={placeId} className='grid gap-1 text-sm font-medium'>
        Where (optional)
        <Input id={placeId} value={location} onChange={(event) => setLocation(event.target.value)} maxLength={200} />
      </label>
      <p className='text-sm text-muted-foreground sm:col-span-2'>
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
  if (booked.not_booked.length > 0) {
    parts.push(
      `Tell ${listed(booked.not_booked.map(nameOf))} yourself: they don’t let you book them, or have no calendar connected.`,
    );
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
  const [who, setWho] = useState<readonly string[]>([]);
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
    setWho((current) => (on ? [...current, userId] : current.filter((id) => id !== userId)));
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
          <div className='flex flex-wrap gap-3'>
            {(sharing.data ?? []).map((share) => (
              <label key={share.user_id} className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={who.includes(share.user_id)}
                  onChange={(event) => toggle(share.user_id, event.target.checked)}
                />
                {nameOf(share.user_id)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className='flex flex-wrap items-end gap-3'>
          <label htmlFor={ids.from} className='grid gap-1 text-sm font-medium'>
            From
            <Input
              id={ids.from}
              type='date'
              value={firstDay}
              min={dayFromToday(0)}
              onChange={(event) => setFirstDay(event.target.value)}
              required
            />
          </label>
          <label htmlFor={ids.days} className='grid w-24 gap-1 text-sm font-medium'>
            Days
            <Input
              id={ids.days}
              type='number'
              min={1}
              max={MAX_DAYS}
              value={days}
              onChange={(event) => setDays(Math.max(1, Math.min(MAX_DAYS, Number(event.target.value) || 1)))}
            />
          </label>
          <label htmlFor={ids.length} className='grid gap-1 text-sm font-medium'>
            For
            <select
              id={ids.length}
              value={minutes}
              onChange={(event) => setMinutes(Number(event.target.value))}
              className={SELECT}
            >
              {LENGTHS.map((length) => (
                <option key={length.minutes} value={length.minutes}>
                  {length.label}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={ids.start} className='grid gap-1 text-sm font-medium'>
            Between
            <Input
              id={ids.start}
              type='time'
              value={dayStart}
              onChange={(event) => setDayStart(event.target.value)}
              required
            />
          </label>
          <label htmlFor={ids.end} className='grid gap-1 text-sm font-medium'>
            And
            <Input id={ids.end} type='time' value={dayEnd} onChange={(event) => setDayEnd(event.target.value)} required />
          </label>
          <Button type='submit' disabled={busy}>
            {busy ? 'Looking…' : 'Find free times'}
          </Button>
        </div>
        <Problem problem={problem} />
      </form>
      {unread.length > 0 && (
        <p className='text-sm text-muted-foreground'>
          Not counted: {unread.map((person) => nameOf(person.user_id)).join(', ')} (no calendar connected, or it did not
          answer).
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
        <ul aria-label='Free times' className='grid gap-2'>
          {(found?.slots ?? []).map((slot) => (
            <li key={slot.start} className='grid gap-2'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span>{slotLabel(slot)}</span>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => setChosen(slot)}
                  aria-label={`Book ${slotLabel(slot)}`}
                >
                  Book
                </Button>
              </div>
              {chosen?.start === slot.start && (
                <BookSlot
                  slot={slot}
                  people={who}
                  nameOf={nameOf}
                  onBooked={(result) => {
                    setChosen(null);
                    setBooked(bookedMessage(result, me, nameOf));
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface AvailabilityPageProps {
  /** The accounts the app knows, to share with and find time with. */
  people?: readonly CalendarPerson[];
  /** Where the user links Google or Microsoft. */
  accountPage?: string;
}

/** Your calendars, who sees when you are busy, and finding and booking a time together. */
export function AvailabilityPage({ people = [], accountPage = DEFAULT_ACCOUNT_PAGE }: AvailabilityPageProps): ReactNode {
  const nameOf: NameOf = (userId) => people.find((person) => person.userId === userId)?.name ?? 'Someone';
  return (
    <div className='grid gap-6'>
      <div className='grid gap-1'>
        <h1 className='text-3xl font-semibold'>Shared availability</h1>
        <p className='text-muted-foreground'>
          When everyone is free, and a date booked into all your calendars. Only busy times are shared, never what they are.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Find a time together</CardTitle>
          <CardDescription>The times you and the people you choose are all free.</CardDescription>
        </CardHeader>
        <CardContent>
          <FindATime nameOf={nameOf} />
        </CardContent>
      </Card>
      <Card>
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
  );
}
