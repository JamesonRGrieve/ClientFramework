// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AvailabilityPage, bookedMessage } from './AvailabilityPage';
import { ALEX, calendarFixture, emptyCalendarStore, JO, ME, SAM } from './calendar.mocks';
import { renderCalendar } from './testing.mocks';

const PEOPLE = [
  { userId: ALEX, name: 'Alex' },
  { userId: SAM, name: 'Sam' },
  { userId: JO, name: 'Jo' },
];
const FIND = { name: 'Find free times' };
const CONNECT = { name: 'Connect a calendar' };
const PASSWORD = 'App password';

describe('AvailabilityPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('finds when you and the people chosen are free, and books a date where it may go', async () => {
    const store = calendarFixture();
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, store);
    const finder = view.getByRole('form', { name: 'Find a time' });
    await user.click(await within(finder).findByRole('checkbox', { name: 'Alex' }));
    await user.click(within(finder).getByRole('checkbox', { name: 'Jo' }));
    await user.selectOptions(within(finder).getByLabelText('For'), '3 hours');
    await user.click(within(finder).getByRole('button', FIND));
    const free = await view.findByRole('list', { name: 'Free times' });
    expect(store.asked).toEqual([{ user_ids: [ALEX, JO], duration_minutes: 180 }]);
    await user.click(within(free).getAllByRole('button', { name: /^Book / })[0] ?? free);
    await user.clear(view.getByLabelText('What'));
    await user.type(view.getByLabelText('What'), 'Dinner');
    await user.click(view.getByRole('button', { name: 'Book it' }));
    expect(await view.findByRole('status')).toHaveTextContent(
      'Booked into your and Alex’s calendars. Tell Jo yourself: they don’t let you book them, or have no calendar connected.',
    );
    expect(store.booked).toEqual([{ title: 'Dinner', user_ids: [ALEX, JO] }]);
  });

  it('wraps finding a time, for an app that holds it to a plan', () => {
    const view = renderCalendar(<AvailabilityPage wrapFind={() => <p>Upgrade to find a time</p>} />);
    expect(view.getByText('Upgrade to find a time')).toBeInTheDocument();
    expect(view.queryByRole('form', { name: 'Find a time' })).toBeNull();
    expect(view.getByRole('form', CONNECT)).toBeInTheDocument();
  });

  it('says whose calendars were not counted', async () => {
    const store = { ...calendarFixture(), unconnected: [ALEX] };
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, store);
    await user.click(await view.findByRole('checkbox', { name: 'Alex' }));
    await user.click(view.getByRole('button', FIND));
    expect(await view.findByText(/Not counted: Alex/)).toBeInTheDocument();
  });

  it('connects a CalDAV calendar, and says when it refuses', async () => {
    const store = emptyCalendarStore();
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, store);
    const form = view.getByRole('form', CONNECT);
    await user.type(within(form).getByLabelText('Calendar address'), 'https://dav.example.org/cal/');
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

  it('sends Google to the account page, and shows the server’s answer', async () => {
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} accountPage='/me' />, emptyCalendarStore());
    const form = view.getByRole('form', CONNECT);
    await user.selectOptions(within(form).getByLabelText('Calendar'), 'Google Calendar');
    expect(within(form).getByRole('link', { name: 'your account page' })).toHaveAttribute('href', '/me');
    expect(within(form).queryByLabelText(PASSWORD)).toBeNull();
    await user.click(within(form).getByRole('button', { name: 'Connect' }));
    expect(await within(form).findByRole('alert')).toHaveTextContent('Sign in with google');
  });

  it('shares when you are busy, lets them book, and stops', async () => {
    const store = calendarFixture();
    const user = userEvent.setup();
    const view = renderCalendar(<AvailabilityPage people={PEOPLE} />, store);
    await user.selectOptions(view.getByLabelText('Share with'), 'Sam');
    await user.click(view.getByRole('button', { name: 'Share' }));
    await vi.waitFor(() => {
      expect(store.shares).toContainEqual({ user_id: SAM, can_book: false });
    });
    const sharing = await view.findByRole('list', { name: 'Sharing with' });
    await vi.waitFor(() => {
      expect(sharing).toHaveTextContent('Sam');
    });
    await user.click(view.getByRole('button', { name: 'Stop sharing with Alex' }));
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

  it('says when it went nowhere, and whose calendar refused it', () => {
    expect(bookedMessage({ booked: [], not_booked: [], failed: [ME] }, ME, nameOf)).toBe(
      'Not booked into any calendar. Your calendar refused it.',
    );
  });
});
