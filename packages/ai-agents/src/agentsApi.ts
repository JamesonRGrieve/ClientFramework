// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { ApiError, type GuardedSave, useClient, useGuardedSave, type Versioned, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const AGENT_ENDPOINT = '/v1/agent';
export const AGENT_ABILITY_ENDPOINT = '/v1/agent-ability';
export const AGENT_MEMORY_ENDPOINT = '/v1/agent-memory';
export const AGENT_CONTEXT_PROMPT_ENDPOINT = '/v1/agent_context_prompt';
export const ABILITY_ENDPOINT = '/v1/ability';
export const ROTATION_ENDPOINT = '/v1/rotation';
export const CONVERSATION_AGENT_ENDPOINT = '/v1/conversation_agent';

const HTTP_NOT_FOUND = 404;

const optionalText = z.string().nullable().optional();
/** The row's version, sent back verbatim as If-Match on every change. */
const versioned = { created_at: optionalText, updated_at: optionalText };

/** An agent: a container of configuration and memories that takes turns. Its owner and team never change. */
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  favourite: z.boolean(),
  /** The rotation of model instances it thinks with; none to use its pinned instances or the default. */
  rotation_id: optionalText,
  image_url: optionalText,
  user_id: optionalText,
  team_id: optionalText,
  ...versioned,
});
export type Agent = z.infer<typeof AgentSchema>;

/** An ability the server offers, which an agent may be granted. */
export const AbilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  friendly_name: optionalText,
  description: optionalText,
  extension_id: z.string(),
  /** A meta ability: about the extension itself rather than a tool. */
  meta: z.boolean().optional(),
});
export type Ability = z.infer<typeof AbilitySchema>;

/** A named rotation of model instances an agent can think with. */
export const RotationSchema = z.object({ id: z.string(), name: z.string() });
export type Rotation = z.infer<typeof RotationSchema>;

/** An agent's grant of an ability: it may use only the abilities granted and enabled. */
export const AgentAbilitySchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  ability_id: z.string(),
  enabled: z.boolean(),
  ...versioned,
});
export type AgentAbility = z.infer<typeof AgentAbilitySchema>;

/** A keyed working memory, put into every turn's prompt; a key is the agent's once. */
export const ShortTermMemorySchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  key: z.string(),
  content: z.string(),
  ...versioned,
});
export type ShortTermMemory = z.infer<typeof ShortTermMemorySchema>;

/** A prompt whose text is put into each of the agent's turns, in the order linked. */
export const AgentContextPromptSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  prompt_id: z.string(),
  ...versioned,
});
export type AgentContextPrompt = z.infer<typeof AgentContextPromptSchema>;

/** The agent's seat in a conversation: whether it takes part, and whether it answers every message. */
export const ConversationSeatSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  conversation_id: z.string(),
  active: z.boolean(),
  auto_respond: z.boolean(),
  ...versioned,
});
export type ConversationSeat = z.infer<typeof ConversationSeatSchema>;

const AgentEnvelopeSchema = z.object({ agent: AgentSchema });

const path = (endpoint: string, id: string): string => `${endpoint}/${encodeURIComponent(id)}`;

/** Favourites first, then by name. */
const byFavouriteThenName = (a: Agent, b: Agent): number =>
  Number(b.favourite) - Number(a.favourite) || a.name.localeCompare(b.name);

/** The agents the user can see, favourites first. */
export function useAgents(): SWRResponse<Agent[], Error> {
  const client = useClient();
  return useSWR<Agent[], Error>(client.url(AGENT_ENDPOINT), async () =>
    (await client.list(AGENT_ENDPOINT, 'agents', AgentSchema)).sort(byFavouriteThenName),
  );
}

/** One agent, or `null` when it doesn't exist or isn't the user's to see (the server answers 404 for both). */
export function useAgent(id: string): SWRResponse<Agent | null, Error> {
  const client = useClient();
  return useSWR<Agent | null, Error>(client.url(path(AGENT_ENDPOINT, id)), async () => {
    try {
      return AgentEnvelopeSchema.parse(await client.get(path(AGENT_ENDPOINT, id))).agent;
    } catch (error) {
      if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  });
}

/** Every ability the server offers, by name. */
export function useAbilities(): SWRResponse<Ability[], Error> {
  const client = useClient();
  return useSWR<Ability[], Error>(client.url(ABILITY_ENDPOINT), async () =>
    (await client.list(ABILITY_ENDPOINT, 'abilities', AbilitySchema)).sort((a, b) => a.name.localeCompare(b.name)),
  );
}

/** The rotations the user can see, by name. */
export function useRotations(): SWRResponse<Rotation[], Error> {
  const client = useClient();
  return useSWR<Rotation[], Error>(client.url(ROTATION_ENDPOINT), async () =>
    (await client.list(ROTATION_ENDPOINT, 'rotations', RotationSchema)).sort((a, b) => a.name.localeCompare(b.name)),
  );
}

/** Rows of `endpoint` (listed under `key`) belonging to agent `agentId`. */
function useAgentRows<T>(endpoint: string, key: string, schema: z.ZodType<T>, agentId: string): SWRResponse<T[], Error> {
  const client = useClient();
  const params = { agent_id: agentId };
  return useSWR<T[], Error>(client.url(endpoint, params), async () => client.list(endpoint, key, schema, params));
}

/** The agent's ability grants. */
export const useAgentAbilities = (agentId: string): SWRResponse<AgentAbility[], Error> =>
  useAgentRows(AGENT_ABILITY_ENDPOINT, 'agent_abilities', AgentAbilitySchema, agentId);

/** The agent's working memory. */
export const useShortTermMemories = (agentId: string): SWRResponse<ShortTermMemory[], Error> =>
  useAgentRows(AGENT_MEMORY_ENDPOINT, 'agent_memories', ShortTermMemorySchema, agentId);

/** The agent's context prompts. */
export const useAgentContextPrompts = (agentId: string): SWRResponse<AgentContextPrompt[], Error> =>
  useAgentRows(AGENT_CONTEXT_PROMPT_ENDPOINT, 'agent_context_prompts', AgentContextPromptSchema, agentId);

/** The conversations the agent takes part in. */
export const useConversationSeats = (agentId: string): SWRResponse<ConversationSeat[], Error> =>
  useAgentRows(CONVERSATION_AGENT_ENDPOINT, 'conversation_agents', ConversationSeatSchema, agentId);

/** Seats the agent in a conversation, answering every message there when `autoRespond`. */
export async function seatInConversation(
  client: ZephyrexClient,
  agentId: string,
  conversationId: string,
  autoRespond: boolean,
): Promise<void> {
  await client.post(CONVERSATION_AGENT_ENDPOINT, {
    conversation_agent: { agent_id: agentId, conversation_id: conversationId, active: true, auto_respond: autoRespond },
  });
}

/** What a new agent is made from. */
export interface NewAgent {
  name: string;
  rotation_id: string | null;
}

/** Makes an agent the user's; resolves to what the server stored. */
export async function createAgent(client: ZephyrexClient, agent: NewAgent): Promise<Agent> {
  const body = { agent: { ...agent } };
  return AgentEnvelopeSchema.parse(await client.post(AGENT_ENDPOINT, body)).agent;
}

/** Grants the agent an ability (enabled). */
export async function grantAbility(client: ZephyrexClient, agentId: string, abilityId: string): Promise<void> {
  await client.post(AGENT_ABILITY_ENDPOINT, { agent_ability: { agent_id: agentId, ability_id: abilityId, enabled: true } });
}

/** Puts a working memory in the agent's every turn. */
export async function addShortTermMemory(
  client: ZephyrexClient,
  agentId: string,
  key: string,
  content: string,
): Promise<void> {
  await client.post(AGENT_MEMORY_ENDPOINT, { agent_memory: { agent_id: agentId, key, content } });
}

/** Puts a prompt's text in the agent's every turn, after those already linked. */
export async function linkContextPrompt(client: ZephyrexClient, agentId: string, promptId: string): Promise<void> {
  await client.post(AGENT_CONTEXT_PROMPT_ENDPOINT, { agent_context_prompt: { agent_id: agentId, prompt_id: promptId } });
}

export interface AgentActions {
  /** `update.save(agent, changes)`: change it, guarded by it as loaded. */
  update: GuardedSave<Agent>;
  /** `remove.save(agent, {})`: delete it, guarded by it as loaded. */
  remove: GuardedSave<Agent>;
}

/** The writes to agent `id`, each refreshing the agents (and the agent) shown. */
export function useAgentActions(id: string): AgentActions {
  const client = useClient();
  const { mutate: refreshAgents } = useAgents();
  const { mutate: refreshAgent } = useAgent(id);
  const update = useCallback(
    async (seen: Agent, changes: Partial<Agent>): Promise<void> => {
      await client.put(path(AGENT_ENDPOINT, seen.id), { agent: changes }, seen);
      await Promise.all([refreshAgents(), refreshAgent()]);
    },
    [client, refreshAgents, refreshAgent],
  );
  const remove = useCallback(
    async (seen: Agent): Promise<void> => {
      await client.delete(path(AGENT_ENDPOINT, seen.id), seen);
      await refreshAgents();
    },
    [client, refreshAgents],
  );
  return { update: useGuardedSave(update, AgentSchema), remove: useGuardedSave(remove, AgentSchema) };
}

/**
 * Changing and removing the rows of one of an agent's lists (`endpoint`, each sent under `single`),
 * each guarded by the row as loaded, refreshing the list after.
 */
function useRowActions<T extends Versioned & { id: string }>(
  endpoint: string,
  single: string,
  schema: z.ZodType<T>,
  refresh: () => Promise<unknown>,
): { update: GuardedSave<T>; remove: GuardedSave<T> } {
  const client = useClient();
  const update = useCallback(
    async (seen: T, changes: Partial<T>): Promise<void> => {
      await client.put(path(endpoint, seen.id), { [single]: { ...changes } }, seen);
      await refresh();
    },
    [client, endpoint, single, refresh],
  );
  const remove = useCallback(
    async (seen: T): Promise<void> => {
      await client.delete(path(endpoint, seen.id), seen);
      await refresh();
    },
    [client, endpoint, refresh],
  );
  return { update: useGuardedSave(update, schema), remove: useGuardedSave(remove, schema) };
}

/** Enabling, disabling and revoking the agent's grants. */
export function useAgentAbilityActions(agentId: string): {
  update: GuardedSave<AgentAbility>;
  remove: GuardedSave<AgentAbility>;
} {
  const { mutate } = useAgentAbilities(agentId);
  return useRowActions(AGENT_ABILITY_ENDPOINT, 'agent_ability', AgentAbilitySchema, mutate);
}

/** Changing and forgetting the agent's working memories. */
export function useShortTermMemoryActions(agentId: string): {
  update: GuardedSave<ShortTermMemory>;
  remove: GuardedSave<ShortTermMemory>;
} {
  const { mutate } = useShortTermMemories(agentId);
  return useRowActions(AGENT_MEMORY_ENDPOINT, 'agent_memory', ShortTermMemorySchema, mutate);
}

/** Changing and ending the agent's conversation seats. */
export function useConversationSeatActions(agentId: string): {
  update: GuardedSave<ConversationSeat>;
  remove: GuardedSave<ConversationSeat>;
} {
  const { mutate } = useConversationSeats(agentId);
  return useRowActions(CONVERSATION_AGENT_ENDPOINT, 'conversation_agent', ConversationSeatSchema, mutate);
}

/** Unlinking the agent's context prompts. */
export function useAgentContextPromptActions(agentId: string): { remove: GuardedSave<AgentContextPrompt> } {
  const { mutate } = useAgentContextPrompts(agentId);
  const { remove } = useRowActions(AGENT_CONTEXT_PROMPT_ENDPOINT, 'agent_context_prompt', AgentContextPromptSchema, mutate);
  return { remove };
}
