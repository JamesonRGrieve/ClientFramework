// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { ChainDetails, chainChanges, chainProblem } from './ChainDetails';
import { CHAIN_ID, chainsFixture } from './chains.mocks';
import { renderChains } from './testing.mocks';

const SAVE = 'Save chain';
const STEPS = 'Most steps a run executes';

describe('chainProblem and chainChanges', () => {
  const digest = rowOf(chainsFixture().chains, CHAIN_ID);
  const draft = {
    name: 'Daily digest',
    description: '',
    favourite: true,
    maxSteps: '100',
    timeoutSeconds: '300',
    maxOutputCharacters: '20000',
  };

  it('wants a name and each bound a whole number up to its ceiling', () => {
    expect(chainProblem(draft)).toBeNull();
    expect(chainProblem({ ...draft, name: ' ' })).toBe('A chain needs a name.');
    expect(chainProblem({ ...draft, timeoutSeconds: '3601' })).toBe(
      'Seconds a run may take is a whole number from 1 to 3600.',
    );
    expect(chainProblem({ ...draft, maxSteps: '1.5' })).toMatch(/^Most steps a run executes/);
  });

  it('keeps only what changed, a blank description being none', () => {
    expect(chainChanges(digest, { ...draft, name: ' Daily digest ' })).toEqual({});
    expect(
      chainChanges(digest, { ...draft, description: ' Mornings ', favourite: false, maxOutputCharacters: '500' }),
    ).toEqual({
      description: 'Mornings',
      favourite: false,
      max_output_characters: 500,
    });
  });
});

describe('ChainDetails', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves a raised bound', async () => {
    const store = chainsFixture();
    const user = userEvent.setup();
    const view = renderChains(<ChainDetails chain={rowOf(store.chains, CHAIN_ID)} />, store);
    await user.clear(view.getByLabelText(STEPS));
    await user.type(view.getByLabelText(STEPS), '250');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Saved.');
    expect(rowOf(store.chains, CHAIN_ID).max_steps).toBe(250);
  });

  it('keeps the user’s change beside the chain as it is now when it changed first', async () => {
    const store = chainsFixture();
    const user = userEvent.setup();
    const view = renderChains(<ChainDetails chain={rowOf(store.chains, CHAIN_ID)} />, store);
    store.chains = store.chains.map((row) =>
      row.id === CHAIN_ID ? { ...row, name: 'Renamed first', updated_at: '2026-10-02T08:00:00.000001' } : row,
    );
    const name = view.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Mine');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('radio', { name: 'Current: Renamed first' })).not.toBeChecked();
  });

  it('says when there is nothing to save or a bound is out of range', async () => {
    const store = chainsFixture();
    const user = userEvent.setup();
    const view = renderChains(<ChainDetails chain={rowOf(store.chains, CHAIN_ID)} />, store);
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Nothing to save.');
    await user.clear(view.getByLabelText(STEPS));
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('alert')).toHaveTextContent('Most steps a run executes is a whole number from 1 to 10000.');
  });

  it('deletes the chain and goes back to the chains', async () => {
    const store = chainsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderChains(<ChainDetails chain={rowOf(store.chains, CHAIN_ID)} />, store);
    await user.click(view.getByRole('button', { name: 'Delete chain' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/chains');
    });
    expect(store.chains.some(({ id }) => id === CHAIN_ID)).toBe(false);
  });
});
