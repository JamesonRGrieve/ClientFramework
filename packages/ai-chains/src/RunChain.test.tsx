// SPDX-License-Identifier: AGPL-3.0-or-later
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHAIN_ID, chainsFixture } from './chains.mocks';
import { RunChain } from './RunChain';
import { renderChains } from './testing.mocks';

const RUN = 'Run it now';
const INPUTS = 'Inputs (optional)';

describe('RunChain', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs the chain with its inputs, and shows how it ended and what it produced', async () => {
    const store = chainsFixture();
    const user = userEvent.setup();
    const view = renderChains(<RunChain chainId={CHAIN_ID} />, store);
    fireEvent.change(view.getByLabelText(INPUTS), { target: { value: '{"topic": "engines"}' } });
    await user.click(view.getByRole('button', { name: RUN }));
    expect(await view.findByRole('status')).toHaveTextContent(/^Done · 4 steps · .+"Done\."$/);
    expect(store.runs.at(-1)).toMatchObject({ inputs: { topic: 'engines' } });
  });

  it('says what is wrong with the inputs before running', async () => {
    const store = chainsFixture();
    const user = userEvent.setup();
    const view = renderChains(<RunChain chainId={CHAIN_ID} />, store);
    await user.type(view.getByLabelText(INPUTS), 'topic');
    await user.click(view.getByRole('button', { name: RUN }));
    expect(await view.findByRole('alert')).toHaveTextContent('The inputs are a JSON object');
    expect(store.runs).toHaveLength(3);
  });

  it('says so when the chain is gone', async () => {
    const user = userEvent.setup();
    const view = renderChains(<RunChain chainId='gone' />);
    await user.click(view.getByRole('button', { name: RUN }));
    expect(await view.findByRole('alert')).toBeInTheDocument();
  });
});
