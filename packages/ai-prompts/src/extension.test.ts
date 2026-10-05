// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { aiPromptsExtension as registered } from 'zephyrex/extensions';
import { aiPromptsExtension } from './extension';
import { PromptPage } from './PromptPage';
import { PromptsPage } from './PromptsPage';

describe('aiPromptsExtension', () => {
  it('is the registered AI prompts extension, with its pages and a menu entry', () => {
    expect(aiPromptsExtension).toMatchObject({ name: 'ai_prompts', serverExtension: 'ai_prompts' });
    expect(aiPromptsExtension.displayName).toBe(registered.displayName);
    expect(aiPromptsExtension.pages).toEqual([
      { path: '/prompts', component: PromptsPage },
      { path: '/prompts/:promptId', component: PromptPage },
    ]);
    expect(aiPromptsExtension.navItems).toEqual([{ title: 'Prompts', url: '/prompts' }]);
  });
});
