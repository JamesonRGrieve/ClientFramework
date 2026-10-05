// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PromptPage } from './PromptPage';
import { SUMMARY_ID } from './prompts.mocks';
import { renderPrompts } from './testing.mocks';

describe('PromptPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the prompt, its arguments and trying it', async () => {
    const view = renderPrompts(<PromptPage params={{ promptId: SUMMARY_ID }} />);
    expect(await view.findByRole('heading', { level: 1, name: 'Summary' })).toBeInTheDocument();
    expect(view.getByRole('form', { name: 'Prompt details' })).toBeInTheDocument();
    expect(await view.findByRole('list', { name: 'Arguments' })).toBeInTheDocument();
    expect(view.getByRole('form', { name: 'Try the prompt' })).toBeInTheDocument();
  });

  it('says a prompt that isn’t there does not exist for the user', async () => {
    const view = renderPrompts(<PromptPage params={{ promptId: 'gone' }} />);
    expect(await view.findByText(/does not exist or is not yours to see/)).toBeInTheDocument();
  });
});
