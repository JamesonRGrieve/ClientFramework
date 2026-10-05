// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { aiPromptsExtension as registered } from 'zephyrex/extensions';
import { PromptPage } from './PromptPage';
import { PromptsPage } from './PromptsPage';
import { PROMPTS_PATH } from './routes';

/** The AI prompts client extension with its pages and menu entry, for an app's `extensions`. */
export const aiPromptsExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: PROMPTS_PATH, component: PromptsPage },
    { path: `${PROMPTS_PATH}/:promptId`, component: PromptPage },
  ],
  navItems: [{ title: 'Prompts', url: PROMPTS_PATH }],
};
