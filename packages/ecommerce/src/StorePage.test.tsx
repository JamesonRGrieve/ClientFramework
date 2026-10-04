// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withSession } from 'zephyrex/testing';
import { StorePage, syncSummary } from './StorePage';
import { renderStore } from './testing.mocks';

describe('syncSummary', () => {
  it('says what a sync read, kind by kind', () => {
    expect(syncSummary({ store: 's', synced: { order: 2, product: 0, return: 'unsupported: no API' } })).toBe(
      '2 orders, 0 products, returns unsupported: no API',
    );
  });
});

describe('StorePage', () => {
  let signOut: () => void = () => undefined;

  beforeEach(() => {
    signOut = withSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    signOut();
  });

  it('shows the sales report, its revenue exactly as the stores wrote it', async () => {
    const view = renderStore(<StorePage />);
    expect(await view.findByText('42.50 CAD')).toBeInTheDocument();
    expect(within(view.getByRole('list', { name: 'Orders by status' })).getByText('Cancelled: 1')).toBeInTheDocument();
    expect(within(view.getByRole('list', { name: 'Top SKUs' })).getByText('MUG-1: 2')).toBeInTheDocument();
  });

  it('narrows the report to one store', async () => {
    const user = userEvent.setup();
    const view = renderStore(<StorePage />);
    await user.selectOptions(await view.findByLabelText('Store'), 'Etsy prints');
    expect(await view.findByText('—')).toBeInTheDocument();
  });

  it('lists the stores, not the other provider instances, and syncs one', async () => {
    const user = userEvent.setup();
    const view = renderStore(<StorePage />);
    const stores = await view.findByRole('list', { name: 'Stores' });
    expect(within(stores).queryByText('GPT')).toBeNull();
    await user.click(within(stores).getByRole('button', { name: 'Sync Etsy prints' }));
    expect(await view.findByRole('status')).toHaveTextContent(
      'Synced: 1 orders, 1 products, returns unsupported: Etsy has no returns API.',
    );
  });
});
