// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHAIN_ID } from './chains.mocks';
import { ChainPage } from './ChainPage';
import { renderChains } from './testing.mocks';

describe('ChainPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the chain with each of its sections', async () => {
    const view = renderChains(<ChainPage params={{ chainId: CHAIN_ID }} />);
    expect(await view.findByRole('heading', { name: 'Daily digest', level: 1 })).toBeInTheDocument();
    for (const title of ['Run it', 'Steps', 'Runs', 'Details']) {
      expect(view.getByRole('heading', { name: title, level: 3 })).toBeInTheDocument();
    }
    expect(view.getByRole('link', { name: 'Chains' })).toHaveAttribute('href', '/chains');
  });

  it('says when the chain does not exist or is not the user’s', async () => {
    const view = renderChains(<ChainPage params={{ chainId: 'gone' }} />);
    expect(await view.findByText(/This chain does not exist or is not yours to see\./)).toBeInTheDocument();
    expect(view.getByRole('link', { name: 'Back to your chains' })).toHaveAttribute('href', '/chains');
  });
});
