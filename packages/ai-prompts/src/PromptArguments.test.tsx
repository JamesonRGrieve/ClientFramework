// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PromptArguments, storedDefault } from './PromptArguments';
import { GREETING_ID, promptsFixture, rowOf, SUMMARY_ID } from './prompts.mocks';
import { renderPrompts } from './testing.mocks';

const AUDIENCE_DEFAULT = 'AUDIENCE default';

describe('storedDefault', () => {
  it('stores a blank default as none (required)', () => {
    expect(storedDefault('')).toBeNull();
    expect(storedDefault('x')).toBe('x');
  });
});

describe('PromptArguments', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows each argument’s default, and offers an argument for each variable without one', async () => {
    const view = renderPrompts(<PromptArguments prompt={rowOf(promptsFixture().prompts, SUMMARY_ID)} />);
    expect(await view.findByLabelText(AUDIENCE_DEFAULT)).toHaveValue('engineers');
    expect(view.getByLabelText('LENGTH default')).toHaveValue('');
    const missing = view.getByRole('group', { name: /Variables without an argument/ });
    expect(
      within(missing)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Add TOPIC']);
  });

  it('adds an argument for a variable, and saves a default guarded by the argument', async () => {
    const store = promptsFixture();
    const user = userEvent.setup();
    const view = renderPrompts(<PromptArguments prompt={rowOf(store.prompts, SUMMARY_ID)} />, store);
    await user.click(await view.findByRole('button', { name: 'Add TOPIC' }));
    expect(await view.findByLabelText('TOPIC default')).toBeInTheDocument();
    expect(store.args.at(-1)).toMatchObject({ prompt_id: SUMMARY_ID, name: 'TOPIC', default_value: null });
    const audience = view.getByLabelText(AUDIENCE_DEFAULT);
    await user.clear(audience);
    await user.click(within(view.getByRole('form', { name: 'Argument AUDIENCE' })).getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => {
      expect(rowOf(store.args, 'arg-audience').default_value).toBeNull();
    });
  });

  it('deletes an argument', async () => {
    const store = promptsFixture();
    const user = userEvent.setup();
    const view = renderPrompts(<PromptArguments prompt={rowOf(store.prompts, SUMMARY_ID)} />, store);
    await view.findByLabelText(AUDIENCE_DEFAULT);
    await user.click(within(view.getByRole('form', { name: 'Argument LENGTH' })).getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(store.args.map(({ id }) => id)).toEqual(['arg-audience']);
    });
  });

  it('says so when the prompt has no arguments', async () => {
    const view = renderPrompts(<PromptArguments prompt={rowOf(promptsFixture().prompts, GREETING_ID)} />);
    expect(await view.findByText('No arguments: every variable is required.')).toBeInTheDocument();
  });
});
