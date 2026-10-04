// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecordsPage } from './RecordsPage';
import { renderHealth } from './testing.mocks';

describe('RecordsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['activity', 'Activities', 'Yoga, 45 min'],
    ['meal', 'Meals', 'Lunch: Soup and bread, 600 kcal'],
    ['weight', 'Weights', '70.4 kg'],
    ['sleep', 'Sleep', '7 h 30 min, quality 80'],
  ])('shows the %s log', async (kind, heading, entry) => {
    const view = renderHealth(<RecordsPage params={{ kind }} />);
    expect(view.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(await view.findByRole('button', { name: entry })).toBeInTheDocument();
  });

  it('says when there is no such log', () => {
    const view = renderHealth(<RecordsPage params={{ kind: 'mood' }} />);
    expect(view.getByText('There is no such health log.')).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Back to health' })).toHaveAttribute('href', '/health');
  });
});
