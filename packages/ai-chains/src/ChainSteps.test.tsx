// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nth } from 'zephyrex/testing';
import { rowOf } from 'zephyrex/testing/msw';
import { CHAIN_ID, chainsFixture } from './chains.mocks';
import { ChainSteps } from './ChainSteps';
import { renderChains } from './testing.mocks';

const ADD = 'Add step';

describe('ChainSteps', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the steps in run order, naming what each calls', async () => {
    const view = renderChains(<ChainSteps chainId={CHAIN_ID} />);
    const list = await view.findByRole('list', { name: 'Steps' });
    await vi.waitFor(() => {
      expect(
        within(list)
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual([
        'search · Use Search the web into foundquery = topicEditDelete',
        'check · If len(found) > 0, go to the next step; otherwise the endEditDelete',
        'summarise · Ask Brief into summaryTEXT = foundEditDelete',
        'done · Set finished to trueEditDelete',
      ]);
    });
  });

  it('adds a step after the last, checking it first', async () => {
    const store = chainsFixture();
    const user = userEvent.setup();
    const view = renderChains(<ChainSteps chainId={CHAIN_ID} />, store);
    const form = within(await view.findByRole('form', { name: 'New step' }));
    await user.click(form.getByRole('button', { name: ADD }));
    expect(await form.findByRole('alert')).toHaveTextContent('A step’s name is a letter');
    await user.type(form.getByLabelText('Step name'), 'greet');
    await user.selectOptions(form.getByLabelText('What it does'), 'Set a variable');
    await user.type(form.getByLabelText('Value'), '"hi"');
    await user.type(form.getByLabelText('Variable'), 'greeting');
    await user.click(form.getByRole('button', { name: ADD }));
    await vi.waitFor(() => {
      expect(store.steps.at(-1)).toMatchObject({
        name: 'greet',
        kind: 'set',
        expression: '"hi"',
        variable: 'greeting',
        position: 4,
      });
    });
    expect(form.getByLabelText('Step name')).toHaveValue('');
  });

  it('edits a step, saving only what changed, and deletes one', async () => {
    const store = chainsFixture();
    const user = userEvent.setup();
    const view = renderChains(<ChainSteps chainId={CHAIN_ID} />, store);
    const items = within(await view.findByRole('list', { name: 'Steps' })).getAllByRole('listitem');
    await user.click(within(nth(items, 1)).getByRole('button', { name: 'Edit' }));
    const form = within(view.getByRole('form', { name: 'Step check' }));
    await user.type(form.getByLabelText('When true, go to (optional)'), 'search');
    await user.click(form.getByRole('button', { name: 'Save step' }));
    await vi.waitFor(() => {
      expect(rowOf(store.steps, 's-check').on_true).toBe('search');
    });
    expect(view.queryByRole('form', { name: 'Step check' })).not.toBeInTheDocument();
    await user.click(within(nth(items, 3)).getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(store.steps.map(({ id }) => id)).not.toContain('s-done');
    });
  });

  it('keeps the user’s change beside the step as it is now when it changed first', async () => {
    const store = chainsFixture();
    const user = userEvent.setup();
    const view = renderChains(<ChainSteps chainId={CHAIN_ID} />, store);
    const items = within(await view.findByRole('list', { name: 'Steps' })).getAllByRole('listitem');
    await user.click(within(nth(items, 3)).getByRole('button', { name: 'Edit' }));
    store.steps = store.steps.map((row) =>
      row.id === 's-done' ? { ...row, expression: 'false', updated_at: '2026-10-02T08:00:00.000001' } : row,
    );
    const form = within(view.getByRole('form', { name: 'Step done' }));
    await user.type(form.getByLabelText('Value'), ' and true');
    await user.click(form.getByRole('button', { name: 'Save step' }));
    expect(await view.findByRole('radio', { name: 'Current: false' })).not.toBeChecked();
  });

  it('says when the chain has no steps', async () => {
    const view = renderChains(<ChainSteps chainId={CHAIN_ID} />, { ...chainsFixture(), steps: [] });
    expect(await view.findByText('No steps yet: a run of it does nothing.')).toBeInTheDocument();
  });
});
