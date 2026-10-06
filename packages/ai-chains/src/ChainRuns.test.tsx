// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nth } from 'zephyrex/testing';
import { rowOf } from 'zephyrex/testing/msw';
import { CHAIN_ID, chainsFixture } from './chains.mocks';
import { ChainRuns } from './ChainRuns';
import { renderChains } from './testing.mocks';

const STEPS = 'Its steps';

describe('ChainRuns', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the runs newest first, offering to stop only the one still running', async () => {
    const view = renderChains(<ChainRuns chainId={CHAIN_ID} />);
    const items = within(await view.findByRole('list', { name: 'Runs' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringMatching(/^Running · .+StopIts steps$/),
      'Failed after 3 steps (a step failed: No model answered)Its steps',
      expect.stringMatching(/^Done · 4 steps · .+Its steps{"topic":"engines"}$/),
    ]);
  });

  it('asks a running run to stop', async () => {
    const store = chainsFixture();
    const user = userEvent.setup();
    const view = renderChains(<ChainRuns chainId={CHAIN_ID} />, store);
    await user.click(await view.findByRole('button', { name: 'Stop' }));
    expect(await view.findByRole('button', { name: 'Stopping…' })).toBeDisabled();
    expect(rowOf(store.runs, 'run-3').cancel_requested).toBe(true);
  });

  it('opens a run onto the steps it executed, and says when it ran none', async () => {
    const user = userEvent.setup();
    const view = renderChains(<ChainRuns chainId={CHAIN_ID} />);
    await view.findByRole('list', { name: 'Runs' });
    await user.click(nth(view.getAllByRole('button', { name: STEPS }), 2));
    expect(await view.findByRole('list', { name: STEPS })).toHaveTextContent(
      '1. search (ability) · succeeded in 1.2s2. check (condition) · succeeded in 0.0s3. summarise (prompt) · succeeded in 2.5s',
    );
    await user.click(view.getByRole('button', { name: 'Hide' }));
    await user.click(nth(view.getAllByRole('button', { name: STEPS }), 1));
    expect(await view.findByText('It ran no steps.')).toBeInTheDocument();
  });

  it('says when the chain has not been run', async () => {
    const view = renderChains(<ChainRuns chainId={CHAIN_ID} />, { ...chainsFixture(), runs: [] });
    expect(await view.findByText('It has not been run yet.')).toBeInTheDocument();
  });
});
