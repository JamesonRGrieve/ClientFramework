// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nth } from 'zephyrex/testing';
import { ALEX, emptyRotaStore, ME, rotaFixture, SAM } from './rota.mocks';
import { RotaPage } from './RotaPage';
import { renderRota } from './testing.mocks';

const WEEKS = 'Nights: the next two weeks';

const PEOPLE = [
  { userId: ALEX, name: 'Alex' },
  { userId: SAM, name: 'Sam' },
];

describe('RotaPage', () => {
  beforeEach(() => {
    // Monday 5 October 2026: the open fourth night of the fixture's cycle.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 5, 12));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows whom the next two weeks are with, by the names the app knows', async () => {
    const view = renderRota(<RotaPage people={PEOPLE} />);
    const weeks = await view.findByRole('region', { name: WEEKS });
    const nights = await within(weeks).findAllByRole('listitem');
    expect(nights).toHaveLength(14);
    expect(nights[0]).toHaveAccessibleName('Mon 5 Oct: Open');
    expect(nights[1]).toHaveAccessibleName('Tue 6 Oct: Alex');
    expect(nights[2]).toHaveAccessibleName('Wed 7 Oct: Sam');
    // Today's tile says so in place of its weekday.
    expect(nights[0]).toHaveTextContent('Today');
    expect(view.getByText('Every 4 nights, from Mon 28 Sept')).toBeInTheDocument();
  });

  it('calls an account it has no name for “Someone”', async () => {
    const view = renderRota(<RotaPage />);
    const weeks = await view.findByRole('region', { name: WEEKS });
    expect((await within(weeks).findAllByRole('listitem'))[1]).toHaveAccessibleName('Tue 6 Oct: Someone');
  });

  it('accepts a night handed to you, and the schedule moves it', async () => {
    const store = rotaFixture();
    const view = renderRota(<RotaPage people={PEOPLE} />, store);
    const swaps = await view.findByRole('region', { name: 'Nights: swaps' });
    expect(swaps).toHaveTextContent('Tue 6 Oct: from Alex to you');
    await userEvent.click(within(swaps).getByRole('button', { name: 'Accept' }));
    expect(await within(swaps).findByText('Accepted')).toBeInTheDocument();
    const weeks = view.getByRole('region', { name: WEEKS });
    await vi.waitFor(() => expect(within(weeks).getAllByRole('listitem')[1]).toHaveAccessibleName('Tue 6 Oct: You'));
    expect(within(weeks).getAllByRole('listitem')[1]).toHaveTextContent('Swapped');
    expect(store.swaps[0]?.status).toBe('accepted');
  });

  it('asks for someone else’s night, and waits for them', async () => {
    const view = renderRota(<RotaPage people={PEOPLE} />);
    const weeks = await view.findByRole('region', { name: WEEKS });
    const sams = nth(await within(weeks).findAllByRole('listitem'), 2);
    await userEvent.click(within(sams).getByRole('button', { name: 'Ask for it' }));
    expect(await view.findByText('Waiting for Sam')).toBeInTheDocument();
  });

  it('hands your own night to someone', async () => {
    const store = rotaFixture();
    store.nights.push({ id: 'n3', rota_id: 'r1', day_index: 3, user_id: ME, created_at: null, updated_at: null });
    const view = renderRota(<RotaPage people={PEOPLE} />, store);
    // Two other people: the night's "Offer to…" menu lists them.
    await userEvent.click(await view.findByRole('button', { name: 'Offer to someone: Mon 5 Oct' }));
    await userEvent.click(await view.findByRole('menuitem', { name: 'Sam' }));
    expect(await view.findByText('Mon 5 Oct: from you to Sam')).toBeInTheDocument();
  });

  it('lets the owner set whom each night of the cycle is with', async () => {
    const store = rotaFixture();
    const view = renderRota(<RotaPage people={PEOPLE} />, store);
    await userEvent.click(await view.findByText('The cycle'));
    const fourth = view.getByRole('radiogroup', { name: 'Night 4 · Thu 1 Oct' });
    expect(within(fourth).getByRole('radio', { name: 'Open' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(within(fourth).getByRole('radio', { name: 'Sam' }));
    await vi.waitFor(() => expect(store.nights.find((night) => night.day_index === 3)?.user_id).toBe(SAM));
    await userEvent.click(
      within(view.getByRole('radiogroup', { name: 'Night 1 · Mon 28 Sept' })).getByRole('radio', { name: 'Open' }),
    );
    await vi.waitFor(() => expect(store.nights.find((night) => night.day_index === 0)).toBeUndefined());
  });

  it('shows a member the rota without its cycle, and who keeps it', async () => {
    const store = rotaFixture();
    store.me = ALEX;
    const view = renderRota(<RotaPage people={[{ userId: ME, name: 'Jo' }]} />, store);
    expect(await view.findByText('Every 4 nights, from Mon 28 Sept · kept by Jo')).toBeInTheDocument();
    expect(view.queryByText('The cycle')).not.toBeInTheDocument();
  });

  it('lets the app put the start form behind something of its own', async () => {
    const view = renderRota(<RotaPage wrapStart={() => <p>Upgrade to start one</p>} />, emptyRotaStore());
    expect(await view.findByText('Upgrade to start one')).toBeInTheDocument();
    expect(view.queryByRole('button', { name: 'Start the rota' })).not.toBeInTheDocument();
  });

  it('starts a first rota', async () => {
    const store = emptyRotaStore();
    const view = renderRota(<RotaPage />, store);
    expect(await view.findByText('Start your first rota')).toBeInTheDocument();
    const cycle = view.getByLabelText('Nights before it repeats');
    await userEvent.clear(cycle);
    await userEvent.type(cycle, '2');
    await userEvent.click(view.getByRole('button', { name: 'Start the rota' }));
    expect(await view.findByText('Every 2 nights, from Mon 5 Oct')).toBeInTheDocument();
    expect(store.rotas[0]).toMatchObject({ name: 'Nights', cycle_days: 2, starts_on: '2026-10-05' });
  });
});
