// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UNDO_MS } from 'zephyrex/hooks/useToast';
import { AvailabilityPage, bookedMessage } from './AvailabilityPage';
import { ALEX, calendarFixture, emptyCalendarStore, JO, ME, SAM } from './calendar.mocks';
import { renderCalendar } from './testing.mocks';

const PEOPLE = [
  { userId: ALEX, name: 'Alex' },
  { userId: SAM, name: 'Sam' },
  { userId: JO, name: 'Jo' },
];
const FIND = { name: 'Find free times' };
const FINDER = { name: 'Find a time' };
const CONNECT = { name: 'Connect a calendar' };
const PASSWORD = 'App password';
const CALDAV = /^CalDAV/;
const ADDRESS = 'Calendar address';
const PRESSED = 'aria-pressed';

describe('AvailabilityPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('finds when you and the people chosen are free', async () => {
    const store = calendarFixture();
    const user = userEvent.setup({ delay: null });
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, store);
    const finder = view.getByRole('form', FINDER);
    // Everyone who shares with you starts chosen.
    expect(await within(finder).findByRole('button', { name: 'Alex' })).toHaveAttribute(PRESSED, 'true');
    expect(within(finder).getByRole('button', { name: 'Jo' })).toHaveAttribute(PRESSED, 'true');
    await user.click(
      within(within(finder).getByRole('group', { name: 'For how long' })).getByRole('button', { name: '3 hours' }),
    );
    await user.click(within(finder).getByRole('button', FIND));
    expect(await view.findByRole('list', { name: 'Free times' })).toBeInTheDocument();
    expect(store.asked).toEqual([{ user_ids: [ALEX, JO], duration_minutes: 180 }]);
  });

  it('colours someone as the app does when it gives their tone', async () => {
    const tone = 5;
    const people = PEOPLE.map((person) => (person.userId === ALEX ? { ...person, tone } : person));
    const view = renderCalendar(<AvailabilityPage people={people} />, calendarFixture());
    const finder = view.getByRole('form', FINDER);
    const alex = await within(finder).findByRole('button', { name: 'Alex' });
    expect(alex.querySelector(`[data-tone="${String(tone)}"]`)).not.toBeNull();
  });

  it('books a free time into the calendars where it may go, and says who to tell', async () => {
    const store = calendarFixture();
    const user = userEvent.setup({ delay: null });
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, store);
    await view.findByRole('button', { name: 'Alex', pressed: true });
    await user.click(view.getByRole('button', FIND));
    const free = await view.findByRole('list', { name: 'Free times' });
    await user.click(within(free).getAllByRole('button', { name: /^Book / })[0] ?? free);
    const what = view.getByLabelText('What');
    await user.clear(what);
    await user.type(what, 'Dinner');
    await user.click(view.getByRole('button', { name: 'Book it' }));
    expect(await view.findByRole('status')).toHaveTextContent(
      'Booked into your and Alex’s calendars. Tell Jo yourself: they don’t let you book them, or have no calendar connected.',
    );
    expect(store.booked).toEqual([{ title: 'Dinner', user_ids: [ALEX, JO] }]);
  });

  it('wraps finding a time, for an app that holds it to a plan', () => {
    const view = renderCalendar(<AvailabilityPage wrapFind={() => <p>Upgrade to find a time</p>} />);
    expect(view.getByText('Upgrade to find a time')).toBeInTheDocument();
    expect(view.queryByRole('form', FINDER)).toBeNull();
    expect(view.getByRole('form', CONNECT)).toBeInTheDocument();
  });

  it('says whose calendars were not counted', async () => {
    const store = { ...calendarFixture(), unconnected: [ME, ALEX] };
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, store);
    await view.findByRole('button', { name: 'Alex', pressed: true });
    await user.click(view.getByRole('button', FIND));
    expect(await view.findByText(/Not counted: You, Alex/)).toBeInTheDocument();
  });

  it('says plainly when there is nobody to share with yet, and offers no dead Share button', async () => {
    const view = renderCalendar(<AvailabilityPage people={[]} />, emptyCalendarStore());
    expect(await view.findByText(/^Nobody in your tree has an account here yet\./)).toBeInTheDocument();
    expect(view.queryByRole('button', { name: 'Share' })).toBeNull();
  });

  it('asks which kind of calendar first, and shows only what that kind needs', async () => {
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, emptyCalendarStore());
    const form = view.getByRole('form', CONNECT);
    expect(within(form).queryByLabelText(ADDRESS)).toBeNull();
    expect(within(form).queryByRole('button', { name: 'Connect' })).toBeNull();
    expect(within(form).getByRole('button', { name: 'Google Calendar' })).toHaveAccessibleDescription(
      'Through the Google account you linked',
    );
    await user.click(within(form).getByRole('button', { name: CALDAV }));
    expect(within(form).getByLabelText(ADDRESS)).toBeInTheDocument();
    expect(within(form).getByRole('button', { name: CALDAV })).toHaveAttribute(PRESSED, 'true');
  });

  it('connects a CalDAV calendar, and says when it refuses', async () => {
    const store = emptyCalendarStore();
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, store);
    const form = view.getByRole('form', CONNECT);
    await user.click(within(form).getByRole('button', { name: CALDAV }));
    await user.type(within(form).getByLabelText(ADDRESS), 'https://dav.example.org/cal/');
    await user.type(within(form).getByLabelText('Sign-in name'), 'me');
    await user.type(within(form).getByLabelText(PASSWORD), 'wrong');
    await user.click(within(form).getByRole('button', { name: 'Connect' }));
    expect(await within(form).findByRole('alert')).toHaveTextContent('refused the sign-in');
    await user.clear(within(form).getByLabelText(PASSWORD));
    await user.type(within(form).getByLabelText(PASSWORD), 'right');
    await user.click(within(form).getByRole('button', { name: 'Connect' }));
    expect(await view.findByRole('list', { name: 'Your calendars' })).toHaveTextContent('CalDAV');
    expect(store.accounts).toHaveLength(1);
  });

  it('folds the form away once a calendar is connected, and opens it again to add another', async () => {
    const store = emptyCalendarStore();
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, store);
    const form = view.getByRole('form', CONNECT);
    await user.click(within(form).getByRole('button', { name: CALDAV }));
    await user.type(within(form).getByLabelText(ADDRESS), 'https://dav.example.org/cal/');
    await user.type(within(form).getByLabelText('Sign-in name'), 'me');
    await user.type(within(form).getByLabelText(PASSWORD), 'right');
    await user.click(within(form).getByRole('button', { name: 'Connect' }));
    await user.click(await view.findByRole('button', { name: 'Connect another calendar' }));
    expect(view.getByRole('form', CONNECT)).toBeInTheDocument();
    await user.click(view.getByRole('button', { name: 'Cancel' }));
    expect(view.queryByRole('form', CONNECT)).toBeNull();
  });

  it('sends Google to the account page, and shows the server’s answer', async () => {
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} accountPage='/me' />, emptyCalendarStore());
    const form = view.getByRole('form', CONNECT);
    await user.click(
      within(within(form).getByRole('group', { name: 'Calendar' })).getByRole('button', { name: 'Google Calendar' }),
    );
    expect(within(form).getByRole('link', { name: 'your account page' })).toHaveAttribute('href', '/me');
    expect(within(form).queryByLabelText(PASSWORD)).toBeNull();
    await user.click(within(form).getByRole('button', { name: 'Connect' }));
    expect(await within(form).findByRole('alert')).toHaveTextContent('Sign in with google');
  });

  it('shares when you are busy, lets them book, and stops', async () => {
    const store = calendarFixture();
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, store);
    await user.click(within(view.getByRole('radiogroup', { name: 'Share with' })).getByRole('radio', { name: 'Sam' }));
    await user.click(view.getByRole('button', { name: 'Share' }));
    await vi.waitFor(() => {
      expect(store.shares).toContainEqual({ user_id: SAM, can_book: false });
    });
    const sharing = await view.findByRole('list', { name: 'Sharing with' });
    await vi.waitFor(() => {
      expect(sharing).toHaveTextContent('Sam');
    });
    // Stopping hides the share at once and keeps it for the undo window; then it ends.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await user.click(view.getByRole('button', { name: 'Stop sharing with Alex' }));
    expect(view.queryByRole('button', { name: 'Stop sharing with Alex' })).not.toBeInTheDocument();
    expect(store.shares).toHaveLength(2);
    vi.advanceTimersByTime(UNDO_MS);
    vi.useRealTimers();
    await vi.waitFor(() => {
      expect(store.shares.map((share) => share.user_id)).toEqual([SAM]);
    });
  });
});

describe('bookedMessage', () => {
  const nameOf = (userId: string): string => PEOPLE.find((person) => person.userId === userId)?.name ?? 'Someone';

  it('says whose calendars a date went into, yours first', () => {
    expect(bookedMessage({ booked: [ME, ALEX, SAM], not_booked: [], failed: [] }, ME, nameOf)).toBe(
      'Booked into your, Alex’s and Sam’s calendars.',
    );
  });

  it('asks you to connect a calendar when you have none, rather than to tell yourself', () => {
    expect(bookedMessage({ booked: [ALEX], not_booked: [ME], failed: [] }, ME, nameOf)).toBe(
      'Booked into Alex’s calendar. Connect a calendar of your own to have it booked there too.',
    );
  });

  it('says when it went nowhere, and whose calendar refused it', () => {
    expect(bookedMessage({ booked: [], not_booked: [], failed: [ME] }, ME, nameOf)).toBe(
      'Not booked into any calendar. Your calendar refused it.',
    );
  });
});
