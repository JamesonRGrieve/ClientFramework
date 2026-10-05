// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's AI prompts extension (zephyrex[ai_prompts]): stored prompts with
// {VARIABLE} placeholders, their arguments' defaults, and building a prompt from values given.
export { aiPromptsExtension } from './extension';
export { PromptPage } from './PromptPage';
export { PromptsPage } from './PromptsPage';
export { PROMPTS_PATH, promptPagePath } from './routes';
export {
  ARGUMENT_ENDPOINT,
  ArgumentSchema,
  buildPrompt,
  BuiltPromptSchema,
  createArgument,
  createPrompt,
  PROMPT_ENDPOINT,
  PromptSchema,
  useArgumentActions,
  useArguments,
  usePrompt,
  usePromptActions,
  usePrompts,
} from './promptsApi';
export type { Argument, ArgumentActions, BuiltPrompt, NewPrompt, Prompt, PromptActions } from './promptsApi';
export { MAX_PROMPT_CHARACTERS, variablesIn } from './promptModel';
