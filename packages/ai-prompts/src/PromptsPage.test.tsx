// SPDX-License-Identifier: AGPL-3.0-or-later
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyPromptStore, promptsFixture } from './prompts.mocks';
import { PromptsPage } from './PromptsPage';
import { renderPrompts } from './testing.mocks';

const STORE = 'Store prompt';

describe('PromptsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the prompts favourites first, each with its variables and linking to its page', async () => {
    const view = renderPrompts(<PromptsPage />);
    const list = await view.findByRole('list', { name: 'Prompts' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['★ Favourite: SummaryVariables: TOPIC, AUDIENCE, LENGTH', 'GreetingNo variables']);
    expect(within(list).getByRole('link', { name: 'Greeting' })).toHaveAttribute('href', '/prompts/greeting');
  });

  it('stores a prompt and opens it', async () => {
    const store = promptsFixture();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    const view = renderPrompts(<PromptsPage />, store);
    await user.type(view.getByLabelText('Name'), 'Translate');
    await user.type(view.getByLabelText('Prompt'), 'Translate {{TEXT}');
    await user.click(view.getByRole('button', { name: STORE }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/prompts/prompt-1');
    });
    expect(store.prompts.at(-1)).toMatchObject({ name: 'Translate', content: 'Translate {TEXT}', description: null });
  });

  it('asks for a name and text before storing', async () => {
    const user = userEvent.setup();
    const view = renderPrompts(<PromptsPage />);
    await user.click(view.getByRole('button', { name: STORE }));
    expect(await view.findByRole('alert')).toHaveTextContent('Give the prompt a name and some text.');
  });

  it('says so when there are no prompts', async () => {
    const view = renderPrompts(<PromptsPage />, emptyPromptStore());
    expect(await view.findByText('You have no prompts yet.')).toBeInTheDocument();
  });
});
