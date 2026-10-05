// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyPromptStore } from './prompts.mocks';
import { usePrompts } from './promptsApi';
import { renderPrompts } from './testing.mocks';

function PromptCount(): string {
  return `${String(usePrompts().data?.length ?? 0)} prompts`;
}

describe('renderPrompts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders under the Zephyrex test app, answering the prompt routes from the given store', async () => {
    const view = renderPrompts(<PromptCount />);
    expect(await view.findByText('2 prompts')).toBeInTheDocument();
  });

  it('serves no prompts from an empty store', async () => {
    const view = renderPrompts(<PromptCount />, emptyPromptStore());
    expect(await view.findByText('0 prompts')).toBeInTheDocument();
  });
});
