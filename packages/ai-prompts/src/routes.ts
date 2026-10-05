// SPDX-License-Identifier: AGPL-3.0-or-later
/** Where the prompt pages mount in the app (the extension's routes and links). */
export const PROMPTS_PATH = '/prompts';

export const promptPagePath = (promptId: string): string => `${PROMPTS_PATH}/${encodeURIComponent(promptId)}`;
