// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory memories server for the package's tests and stories (never compiled into dist): an
// agent's memories, kept (source "user") and recalled by words as the server does without an
// embedding model, and deleted held to their version. There is no route to change one.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { refuseStale, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import { MAX_RECALL, type Memory, MEMORY_ENDPOINT } from './memoriesApi';

const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;

export const AGENT_ID = 'agent-1';

export interface MemoryStore {
  memories: Memory[];
}

const memory = (id: string, key: string | null, content: string, minute: string, embeddingModel: string | null): Memory => ({
  id,
  agent_id: AGENT_ID,
  conversation_id: null,
  key,
  content,
  source: 'agent',
  embedding_model: embeddingModel,
  user_id: 'u-me',
  created_at: `2026-10-01T09:${minute}:00.000001`,
  updated_at: null,
});

/** Two memories of the agent's (one embedded) and one of another agent's. */
export function memoriesFixture(): MemoryStore {
  return {
    memories: [
      memory('m-coffee', 'coffee', 'The user takes their coffee black.', '01', 'text-embedding-3-small'),
      memory('m-deadline', null, 'The engine report is due on Friday.', '02', null),
      { ...memory('m-other', null, 'Another agent’s note about coffee.', '03', null), agent_id: 'agent-2' },
    ],
  };
}

/** A store with nothing in it. */
export const emptyMemoryStore = (): MemoryStore => ({ memories: [] });

/** The memory `id` of `store`; a test or story naming one that isn't there is a mistake in it. */
export function memoryOf(store: MemoryStore, id: string): Memory {
  const found = store.memories.find((row) => row.id === id);
  if (found === undefined) {
    throw new Error(`No memory ${id} in the fixture`);
  }
  return found;
}

const RememberBodySchema = z.object({
  agent_id: z.string(),
  content: z.string(),
  key: z.string().nullable().optional(),
});
const RecallBodySchema = z.object({ agent_id: z.string(), query: z.string(), limit: z.number().int().max(MAX_RECALL) });

const wordsOf = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word !== '');

/** The memory routes over `store`. */
export function memoryHandlers(store: MemoryStore = memoriesFixture()): RequestHandler[] {
  let kept = 0;
  return [
    http.get(`*${MEMORY_ENDPOINT}`, ({ request }) => {
      const agentId = new URL(request.url).searchParams.get('agent_id');
      return HttpResponse.json({ memories: store.memories.filter((row) => agentId === null || row.agent_id === agentId) });
    }),
    http.post(`*${MEMORY_ENDPOINT}/remember`, async ({ request }) => {
      const body = RememberBodySchema.parse(await request.json());
      kept += 1;
      const row: Memory = {
        ...memory(`m-${String(kept)}`, body.key ?? null, body.content, '00', null),
        agent_id: body.agent_id,
        source: 'user',
        created_at: versionStamp(),
      };
      store.memories.push(row);
      return HttpResponse.json(row);
    }),
    http.post(`*${MEMORY_ENDPOINT}/recall`, async ({ request }) => {
      const { agent_id: agentId, query, limit } = RecallBodySchema.parse(await request.json());
      const terms = new Set(wordsOf(query));
      const own = store.memories.filter((row) => row.agent_id === agentId);
      const related =
        terms.size === 0
          ? own
          : own.filter((row) => wordsOf(`${row.key ?? ''} ${row.content}`).some((word) => terms.has(word)));
      return HttpResponse.json({ memories: related.slice(0, limit) });
    }),
    http.delete(`*${MEMORY_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = store.memories.find((row) => row.id === id);
      if (current === undefined) {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      store.memories = store.memories.filter((row) => row.id !== current.id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
  ];
}
