// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom } from 'zephyrex/testing/msw';
import { z } from 'zod';
import { AGENT_ID, memoriesFixture, memoryHandlers, memoryOf } from './memories.mocks';
import { MemorySchema } from './memoriesApi';

const RecalledSchema = z.object({ memories: z.array(MemorySchema) });

const BASE = 'http://localhost:1996';
const HTTP_NO_CONTENT = 204;
const HTTP_PRECONDITION_REQUIRED = 428;

describe('the mock memories server', () => {
  it('keeps an agent’s memories apart, recalls the most recent for a blank question, and holds a delete to its version', async () => {
    const store = memoriesFixture();
    const serve = fetchFrom(memoryHandlers(store));
    const recalled = RecalledSchema.parse(
      await (
        await serve(`${BASE}/v1/memory/recall`, {
          method: 'POST',
          body: JSON.stringify({ agent_id: AGENT_ID, query: ' ', limit: 5 }),
        })
      ).json(),
    );
    expect(recalled.memories.map(({ id }) => id)).toEqual(['m-coffee', 'm-deadline']);
    const url = `${BASE}/v1/memory/m-coffee`;
    expect((await serve(url, { method: 'DELETE' })).status).toBe(HTTP_PRECONDITION_REQUIRED);
    const version = `"${memoryOf(store, 'm-coffee').created_at ?? ''}"`;
    expect((await serve(url, { method: 'DELETE', headers: { 'If-Match': version } })).status).toBe(HTTP_NO_CONTENT);
  });
});
