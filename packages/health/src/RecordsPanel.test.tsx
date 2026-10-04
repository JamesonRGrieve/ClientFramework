// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { healthFixture } from './health.mocks';
import { RecordsPanel } from './RecordsPanel';
import { sleepType, weightType } from './recordTypes';
import { renderHealth } from './testing.mocks';

const WEIGHTS = 'Weights';
const LATEST = '70.1 kg, 21.5% body fat';

describe('RecordsPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the log newest first', async () => {
    const view = renderHealth(<RecordsPanel type={weightType} />);
    const list = await view.findByRole('list', { name: WEIGHTS });
    expect(
      within(list)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual([LATEST, '70.4 kg']);
  });

  it('records a new entry', async () => {
    const store = healthFixture();
    const user = userEvent.setup();
    const view = renderHealth(<RecordsPanel type={weightType} />, store);
    const form = await view.findByRole('form', { name: 'New weight' });
    await user.type(within(form).getByLabelText('Weight (kg)'), '69.8');
    await user.click(within(form).getByRole('button', { name: 'Record weight' }));
    expect(await view.findByRole('status')).toHaveTextContent('Recorded.');
    expect(store.weights.at(-1)).toMatchObject({ weight_kg: 69.8, body_fat_percent: null });
  });

  it('refuses a night that ends before it starts, without asking the server', async () => {
    const store = healthFixture();
    const user = userEvent.setup();
    const view = renderHealth(<RecordsPanel type={sleepType} />, store);
    const form = await view.findByRole('form', { name: 'New sleep' });
    await user.type(within(form).getByLabelText('Bedtime'), '2026-10-02T08:00');
    await user.clear(within(form).getByLabelText('Woke'));
    await user.type(within(form).getByLabelText('Woke'), '2026-10-01T23:00');
    await user.click(within(form).getByRole('button', { name: 'Record sleep' }));
    expect(await view.findByRole('alert')).toHaveTextContent('Waking must come after bedtime, within a day.');
    expect(store.sleeps).toHaveLength(1);
  });

  it('changes an entry, and keeps the user’s value beside the current one when someone changed it first', async () => {
    const store = healthFixture();
    const user = userEvent.setup();
    const view = renderHealth(<RecordsPanel type={weightType} />, store);
    await user.click(await view.findByRole('button', { name: LATEST }));
    store.weights = store.weights.map((row) =>
      row.id === 'w2' ? { ...row, weight_kg: 70.0, updated_at: '2026-10-02T09:00:00.000002' } : row,
    );
    const editor = view.getByRole('form', { name: 'Edit weight' });
    const weight = within(editor).getByLabelText('Weight (kg)');
    await user.clear(weight);
    await user.type(weight, '69.9');
    await user.click(within(editor).getByRole('button', { name: 'Save' }));
    expect(await view.findByRole('radio', { name: 'Yours: 69.9' })).toBeChecked();
    expect(view.getByRole('radio', { name: 'Current: 70' })).not.toBeChecked();
    await user.click(view.getByRole('button', { name: 'Save merged' }));
    expect(await view.findByText('Saved.')).toBeInTheDocument();
    expect(store.weights.find(({ id }) => id === 'w2')?.weight_kg).toBe(69.9);
  });

  it('deletes an entry', async () => {
    const store = healthFixture();
    const user = userEvent.setup();
    const view = renderHealth(<RecordsPanel type={weightType} />, store);
    await user.click(await view.findByRole('button', { name: '70.4 kg' }));
    await user.click(view.getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(view.queryByRole('button', { name: '70.4 kg' })).toBeNull();
    });
    expect(store.weights.map(({ id }) => id)).toEqual(['w2']);
  });

  it('says so when nothing is recorded', async () => {
    const view = renderHealth(<RecordsPanel type={sleepType} />, { activities: [], meals: [], weights: [], sleeps: [] });
    expect(await view.findByText('No sleep recorded yet.')).toBeInTheDocument();
  });
});
