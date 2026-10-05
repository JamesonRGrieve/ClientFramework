// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/ai-prompts', () => {
  it('publishes the pages, the reads and writes behind them, and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'ARGUMENT_ENDPOINT',
        'ArgumentSchema',
        'BuiltPromptSchema',
        'MAX_PROMPT_CHARACTERS',
        'PROMPTS_PATH',
        'PROMPT_ENDPOINT',
        'PromptPage',
        'PromptSchema',
        'PromptsPage',
        'aiPromptsExtension',
        'buildPrompt',
        'createArgument',
        'createPrompt',
        'promptPagePath',
        'useArgumentActions',
        'useArguments',
        'usePrompt',
        'usePromptActions',
        'usePrompts',
        'variablesIn',
      ].sort(),
    );
  });
});
