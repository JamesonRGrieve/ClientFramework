// SPDX-License-Identifier: AGPL-3.0-or-later
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PromptEditor, promptChanges } from './PromptEditor';
import { promptsFixture, rowOf, SUMMARY_ID } from './prompts.mocks';
import { renderPrompts } from './testing.mocks';

const SAVE = 'Save prompt';

describe('promptChanges', () => {
  const summary = rowOf(promptsFixture().prompts, SUMMARY_ID);
  const draft = { name: 'Summary', description: '', favourite: true, content: summary.content };

  it('keeps only what changed, trimmed, a blank description being none', () => {
    expect(promptChanges(summary, { ...draft, name: ' Summary ' })).toEqual({});
    expect(promptChanges(summary, { ...draft, favourite: false, description: ' Short ' })).toEqual({
      favourite: false,
      description: 'Short',
    });
  });
});

describe('PromptEditor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves a change to the prompt', async () => {
    const store = promptsFixture();
    const user = userEvent.setup();
    const view = renderPrompts(<PromptEditor prompt={rowOf(store.prompts, SUMMARY_ID)} />, store);
    await user.click(view.getByLabelText('Favourite'));
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Saved.');
    expect(rowOf(store.prompts, SUMMARY_ID).favourite).toBe(false);
  });

  it('keeps the user’s text beside the prompt as it is now when it changed first', async () => {
    const store = promptsFixture();
    const user = userEvent.setup();
    const view = renderPrompts(<PromptEditor prompt={rowOf(store.prompts, SUMMARY_ID)} />, store);
    store.prompts = store.prompts.map((row) =>
      row.id === SUMMARY_ID ? { ...row, name: 'Renamed first', updated_at: '2026-10-02T08:00:00.000001' } : row,
    );
    const name = view.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Mine');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('radio', { name: 'Current: Renamed first' })).not.toBeChecked();
  });

  it('says when there is nothing to save, and wants a name and text', async () => {
    const store = promptsFixture();
    const user = userEvent.setup();
    const view = renderPrompts(<PromptEditor prompt={rowOf(store.prompts, SUMMARY_ID)} />, store);
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('status')).toHaveTextContent('Nothing to save.');
    await user.clear(view.getByLabelText('Prompt'));
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('alert')).toHaveTextContent('A prompt needs a name and some text.');
  });

  it('deletes the prompt and goes back to the prompts', async () => {
    const store = promptsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderPrompts(<PromptEditor prompt={rowOf(store.prompts, SUMMARY_ID)} />, store);
    await user.click(view.getByRole('button', { name: 'Delete prompt' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/prompts');
    });
    expect(store.prompts.some(({ id }) => id === SUMMARY_ID)).toBe(false);
  });
});
