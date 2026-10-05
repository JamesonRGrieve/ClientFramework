// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { ApiError, type GuardedSave, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const PROMPT_ENDPOINT = '/v1/prompt';
export const ARGUMENT_ENDPOINT = '/v1/prompt-argument';

const HTTP_NOT_FOUND = 404;

const optionalText = z.string().nullable().optional();

/** A stored prompt, its variables marked {VARIABLE_NAME}. Its owner and team never change. */
export const PromptSchema = z.object({
  id: z.string(),
  name: optionalText,
  description: optionalText,
  favourite: z.boolean(),
  content: z.string(),
  user_id: optionalText,
  team_id: optionalText,
  // The row's version, sent back verbatim as If-Match on every change.
  created_at: optionalText,
  updated_at: optionalText,
});
export type Prompt = z.infer<typeof PromptSchema>;

/** One of a prompt's variables, with the value used when none is given (none: required). */
export const ArgumentSchema = z.object({
  id: z.string(),
  prompt_id: z.string(),
  name: optionalText,
  default_value: optionalText,
  created_at: optionalText,
  updated_at: optionalText,
});
export type Argument = z.infer<typeof ArgumentSchema>;

/** A prompt filled from the values given and its arguments' defaults, and what is still missing. */
export const BuiltPromptSchema = z.object({ text: z.string(), missing: z.array(z.string()) });
export type BuiltPrompt = z.infer<typeof BuiltPromptSchema>;

/** What a new prompt is made from. */
export interface NewPrompt {
  name: string;
  description: string | null;
  content: string;
}

const PromptEnvelopeSchema = z.object({ prompt: PromptSchema });
const ArgumentEnvelopeSchema = z.object({ prompt_argument: ArgumentSchema });

const promptPath = (id: string): string => `${PROMPT_ENDPOINT}/${encodeURIComponent(id)}`;
const argumentPath = (id: string): string => `${ARGUMENT_ENDPOINT}/${encodeURIComponent(id)}`;

/** Favourites first, then by name. */
const byFavouriteThenName = (a: Prompt, b: Prompt): number =>
  Number(b.favourite) - Number(a.favourite) || (a.name ?? '').localeCompare(b.name ?? '');

/** The prompts the user can see, favourites first. */
export function usePrompts(): SWRResponse<Prompt[], Error> {
  const client = useClient();
  return useSWR<Prompt[], Error>(client.url(PROMPT_ENDPOINT), async () =>
    (await client.list(PROMPT_ENDPOINT, 'prompts', PromptSchema)).sort(byFavouriteThenName),
  );
}

/** One prompt, or `null` when it doesn't exist or isn't the user's to see (the server answers 404 for both). */
export function usePrompt(id: string): SWRResponse<Prompt | null, Error> {
  const client = useClient();
  return useSWR<Prompt | null, Error>(client.url(promptPath(id)), async () => {
    try {
      return PromptEnvelopeSchema.parse(await client.get(promptPath(id))).prompt;
    } catch (error) {
      if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  });
}

/** A prompt's arguments, by name. */
export function useArguments(promptId: string): SWRResponse<Argument[], Error> {
  const client = useClient();
  const params = { prompt_id: promptId };
  return useSWR<Argument[], Error>(client.url(ARGUMENT_ENDPOINT, params), async () =>
    (await client.list(ARGUMENT_ENDPOINT, 'prompt_arguments', ArgumentSchema, params)).sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? ''),
    ),
  );
}

/** Stores a prompt as the user's; resolves to what the server stored. */
export async function createPrompt(client: ZephyrexClient, prompt: NewPrompt): Promise<Prompt> {
  const body = { prompt: { ...prompt } };
  return PromptEnvelopeSchema.parse(await client.post(PROMPT_ENDPOINT, body)).prompt;
}

/** Gives a prompt an argument for variable `name`, with `defaultValue` (null: required). */
export async function createArgument(
  client: ZephyrexClient,
  promptId: string,
  name: string,
  defaultValue: string | null,
): Promise<Argument> {
  const body = { prompt_argument: { prompt_id: promptId, name, default_value: defaultValue } };
  return ArgumentEnvelopeSchema.parse(await client.post(ARGUMENT_ENDPOINT, body)).prompt_argument;
}

/** The prompt filled from `variables`, then its arguments' defaults. */
export async function buildPrompt(
  client: ZephyrexClient,
  promptId: string,
  variables: Readonly<Record<string, string>>,
): Promise<BuiltPrompt> {
  return BuiltPromptSchema.parse(await client.post(`${promptPath(promptId)}/build`, { variables: { ...variables } }));
}

export interface PromptActions {
  /** `update.save(prompt, changes)`: change it, guarded by it as loaded. */
  update: GuardedSave<Prompt>;
  /** `remove.save(prompt, {})`: delete it, guarded by it as loaded. */
  remove: GuardedSave<Prompt>;
}

/** The writes to prompt `id`, each refreshing the prompts (and the prompt) shown. */
export function usePromptActions(id: string): PromptActions {
  const client = useClient();
  const { mutate: refreshPrompts } = usePrompts();
  const { mutate: refreshPrompt } = usePrompt(id);
  const update = useCallback(
    async (seen: Prompt, changes: Partial<Prompt>): Promise<void> => {
      await client.put(promptPath(seen.id), { prompt: changes }, seen);
      await Promise.all([refreshPrompts(), refreshPrompt()]);
    },
    [client, refreshPrompts, refreshPrompt],
  );
  const remove = useCallback(
    async (seen: Prompt): Promise<void> => {
      await client.delete(promptPath(seen.id), seen);
      await refreshPrompts();
    },
    [client, refreshPrompts],
  );
  return { update: useGuardedSave(update, PromptSchema), remove: useGuardedSave(remove, PromptSchema) };
}

export interface ArgumentActions {
  /** `update.save(argument, { default_value })`: change its default, guarded by it as loaded. */
  update: GuardedSave<Argument>;
  /** `remove.save(argument, {})`: delete it, guarded by it as loaded. */
  remove: GuardedSave<Argument>;
}

/** The writes to `promptId`'s arguments, each refreshing them. */
export function useArgumentActions(promptId: string): ArgumentActions {
  const client = useClient();
  const { mutate: refreshArguments } = useArguments(promptId);
  const update = useCallback(
    async (seen: Argument, changes: Partial<Argument>): Promise<void> => {
      await client.put(argumentPath(seen.id), { prompt_argument: changes }, seen);
      await refreshArguments();
    },
    [client, refreshArguments],
  );
  const remove = useCallback(
    async (seen: Argument): Promise<void> => {
      await client.delete(argumentPath(seen.id), seen);
      await refreshArguments();
    },
    [client, refreshArguments],
  );
  return { update: useGuardedSave(update, ArgumentSchema), remove: useGuardedSave(remove, ArgumentSchema) };
}
