// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HealthPage } from './HealthPage';
import { renderHealth } from './testing.mocks';

describe('HealthPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('sums up the logs, each linking to its own', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 30, 12));
    const view = renderHealth(<HealthPage />);
    expect(await view.findByText('70.1 kg')).toBeInTheDocument();
    expect(await view.findByText('7 h 30 min')).toBeInTheDocument();
    expect(await view.findByText('1 h 15 min')).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Sleep' })).toHaveAttribute('href', '/health/sleep');
  });

  it('shows a dash for a log with nothing in it', async () => {
    const view = renderHealth(<HealthPage />, { activities: [], meals: [], weights: [], sleeps: [] });
    expect(await view.findByText('Nothing weighed yet')).toBeInTheDocument();
    expect(view.getByText('No nights recorded yet')).toBeInTheDocument();
  });
});
