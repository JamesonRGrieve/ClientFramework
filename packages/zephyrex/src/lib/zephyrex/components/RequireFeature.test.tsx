// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Entitlement, ENTITLEMENT_PATH } from '../useEntitlement';
import { RequireFeature } from './RequireFeature';
import { fetchFrom } from '@/testing/msw';
import { TestWrapper } from '@/testing/TestWrapper';

const CONTENT = 'Your calendars, side by side.';

const serve = (features: string[]): void => {
  const entitlement: Entitlement = { plan: 'basic', features, limits: {}, seats: 0, seats_given: 0, via_seat_from: null };
  vi.stubGlobal('fetch', vi.fn(fetchFrom([http.get(`*${ENTITLEMENT_PATH}`, () => HttpResponse.json(entitlement))])));
};

const renderGate = (fallback?: string) =>
  render(
    <TestWrapper>
      <RequireFeature feature='calendar_sync' title='Calendar sync' fallback={fallback}>
        <p>{CONTENT}</p>
      </RequireFeature>
    </TestWrapper>,
  );

describe('RequireFeature', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the feature when the plan unlocks it', async () => {
    serve(['calendar_sync']);
    const view = renderGate();
    expect(await view.findByText(CONTENT)).toBeInTheDocument();
  });

  it('offers an upgrade, naming the feature, when the plan lacks it', async () => {
    serve(['map']);
    const view = renderGate();
    const prompt = await view.findByRole('note', { name: 'Upgrade' });
    expect(prompt).toHaveTextContent('Calendar sync is part of a paid plan.');
    expect(view.getByRole('link', { name: 'See plans' })).toHaveAttribute('href', '/user/subscribe');
    expect(view.queryByText(CONTENT)).toBeNull();
  });

  it("sends the upgrade to the app's own plans page when it has one", async () => {
    serve([]);
    const view = render(
      <TestWrapper config={{ app: { name: 'Test App', plans: '/plan' } }}>
        <RequireFeature feature='calendar_sync'>
          <p>{CONTENT}</p>
        </RequireFeature>
      </TestWrapper>,
    );
    expect(await view.findByRole('link', { name: 'See plans' })).toHaveAttribute('href', '/plan');
  });

  it('shows the given fallback instead of the prompt', async () => {
    serve([]);
    const view = renderGate('Locked');
    expect(await view.findByText('Locked')).toBeInTheDocument();
  });
});
