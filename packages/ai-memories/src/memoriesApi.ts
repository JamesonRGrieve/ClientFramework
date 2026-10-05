// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { type GuardedSave, serverInstant, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const MEMORY_ENDPOINT = '/v1/memory';

/** The server's longest memory. */
export const MAX_MEMORY_CHARACTERS = 20_000;
/** The most memories one recall returns. */
export const MAX_RECALL = 50;

const optionalText = z.string().nullable().optional();

/**
 * Something kept for the long term about an agent, for its owner. What is remembered never
 * changes; a memory is kept or deleted. Its embedding (when the server has an embedding model)
 * lets recall rank by meaning; without one, recall matches words.
 */
export const MemorySchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  conversation_id: optionalText,
  /** A short label. */
  key: optionalText,
  content: z.string(),
  /** Where it came from: agent, user or import. */
  source: z.string(),
  /** The model that embedded it; none when it is recalled by its words alone. */
  embedding_model: optionalText,
  user_id: optionalText,
  // The row's version, sent back verbatim as If-Match when it is deleted.
  created_at: optionalText,
  updated_at: optionalText,
});
export type Memory = z.infer<typeof MemorySchema>;

const RecalledSchema = z.object({ memories: z.array(MemorySchema) });

const memoryPath = (id: string): string => `${MEMORY_ENDPOINT}/${encodeURIComponent(id)}`;
const NO_TIME = '1970-01-01T00:00:00';
const keptAt = ({ created_at: created }: Memory): number => serverInstant(created ?? NO_TIME).getTime();

/** What the user keeps for an agent: the text, and a short label if they give one. */
export interface NewMemory {
  agentId: string;
  content: string;
  key: string | null;
}

/** An agent's memories, newest first. */
export function useMemories(agentId: string): SWRResponse<Memory[], Error> {
  const client = useClient();
  const params = { agent_id: agentId };
  return useSWR<Memory[], Error>(client.url(MEMORY_ENDPOINT, params), async () =>
    (await client.list(MEMORY_ENDPOINT, 'memories', MemorySchema, params)).sort((a, b) => keptAt(b) - keptAt(a)),
  );
}

/**
 * Keeps a memory for an agent as the user's (its source is "user"), embedded when the server has
 * an embedding model. Like the server's other actions, it answers with the memory itself.
 */
export async function remember(client: ZephyrexClient, memory: NewMemory): Promise<Memory> {
  return MemorySchema.parse(
    await client.post(`${MEMORY_ENDPOINT}/remember`, {
      agent_id: memory.agentId,
      content: memory.content,
      ...(memory.key === null ? {} : { key: memory.key }),
    }),
  );
}

/** The agent's memories most related to `query` (its most recent, for a blank one), at most `limit`. */
export async function recall(client: ZephyrexClient, agentId: string, query: string, limit: number): Promise<Memory[]> {
  return RecalledSchema.parse(await client.post(`${MEMORY_ENDPOINT}/recall`, { agent_id: agentId, query, limit })).memories;
}

/** Deleting one of `agentId`'s memories, guarded by it as loaded: `remove.save(memory, {})`. */
export function useMemoryActions(agentId: string): { remove: GuardedSave<Memory> } {
  const client = useClient();
  const { mutate: refreshMemories } = useMemories(agentId);
  const remove = useCallback(
    async (seen: Memory): Promise<void> => {
      await client.delete(memoryPath(seen.id), seen);
      await refreshMemories();
    },
    [client, refreshMemories],
  );
  return { remove: useGuardedSave(remove, MemorySchema) };
}
