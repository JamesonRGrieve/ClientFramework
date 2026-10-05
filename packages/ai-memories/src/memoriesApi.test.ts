// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { type Call, recordingFetch, writesOf } from 'zephyrex/testing/msw';
import { AGENT_ID, memoriesFixture, memoryHandlers, memoryOf } from './memories.mocks';
import { recall, remember, useMemories, useMemoryActions } from './memoriesApi';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

describe('the memories API', () => {
  let store = memoriesFixture();
  let calls: Call[] = [];

  beforeEach(() => {
    store = memoriesFixture();
    const recorded = recordingFetch(memoryHandlers(store));
    calls = recorded.calls;
    vi.stubGlobal('fetch', vi.fn(recorded.fetch));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads an agent’s memories newest first', async () => {
    const { result } = renderHook(() => useMemories(AGENT_ID), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data?.map(({ id }) => id)).toEqual(['m-deadline', 'm-coffee']);
    });
  });

  it('keeps a memory, recalls by a question, and deletes guarded by the memory as loaded', async () => {
    const kept = await remember(client, { agentId: AGENT_ID, content: 'Prefers tea in the evening.', key: null });
    expect(kept).toMatchObject({ agent_id: AGENT_ID, source: 'user', key: null });
    await expect(recall(client, AGENT_ID, 'coffee?', 5)).resolves.toMatchObject([{ id: 'm-coffee' }]);
    const { result } = renderHook(() => useMemoryActions(AGENT_ID), { wrapper: TestWrapper });
    await expect(result.current.remove.save(memoryOf(store, 'm-coffee'), {})).resolves.toBe(true);
    expect(writesOf(calls)).toEqual([
      ['POST', '/v1/memory/remember', `{"agent_id":"${AGENT_ID}","content":"Prefers tea in the evening."}`, null],
      ['POST', '/v1/memory/recall', `{"agent_id":"${AGENT_ID}","query":"coffee?","limit":5}`, null],
      ['DELETE', '/v1/memory/m-coffee', undefined, '"2026-10-01T09:01:00.000001"'],
    ]);
  });
});
