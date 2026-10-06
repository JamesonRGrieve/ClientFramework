// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { loaded, nth, TestWrapper, testConfig } from 'zephyrex/testing';
import { type Call, rowOf, writesOf } from 'zephyrex/testing/msw';
import { AGENT_ID, agentsFixture, FIXTURE_VERSION } from './agents.mocks';
import {
  addShortTermMemory,
  createAgent,
  grantAbility,
  linkContextPrompt,
  seatInConversation,
  useAbilities,
  useAgent,
  useAgentAbilities,
  useAgentAbilityActions,
  useAgentActions,
  useAgentContextPromptActions,
  useAgentContextPrompts,
  useAgents,
  useConversationSeatActions,
  useConversationSeats,
  useRotations,
  useShortTermMemories,
  useShortTermMemoryActions,
} from './agentsApi';
import { recordCalls } from './testing.mocks';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });
const LOADED = `"${FIXTURE_VERSION}"`;
const GRANT_ID = 'grant-search';

const idsOf = (rows: readonly { id: string }[] | undefined): string[] | undefined => rows?.map(({ id }) => id);

describe('the agents API', () => {
  let store = agentsFixture();
  let calls: Call[] = [];

  beforeEach(() => {
    store = agentsFixture();
    calls = recordCalls(store);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the agents favourites first, one agent or null, and the abilities and rotations by name', async () => {
    expect(idsOf(await loaded(() => useAgents()))).toEqual([AGENT_ID, 'helper']);
    expect(await loaded(() => useAgent('gone'))).toBeNull();
    expect(idsOf(await loaded(() => useAbilities()))).toEqual(['ab-email', 'ab-search']);
    expect(idsOf(await loaded(() => useRotations()))).toEqual(['fast']);
  });

  it('reads only the agent’s grants, working memory, context prompts and seats', async () => {
    store.grants.push({ ...rowOf(store.grants, GRANT_ID), id: 'not-mine', agent_id: 'helper' });
    expect(idsOf(await loaded(() => useAgentAbilities(AGENT_ID)))).toEqual([GRANT_ID]);
    expect(idsOf(await loaded(() => useShortTermMemories(AGENT_ID)))).toEqual(['wm-tone']);
    expect(idsOf(await loaded(() => useAgentContextPrompts(AGENT_ID)))).toEqual(['acp-1']);
    expect(idsOf(await loaded(() => useConversationSeats(AGENT_ID)))).toEqual(['seat-1']);
    expect(new URL(nth(calls, -1).url).searchParams.get('agent_id')).toBe(AGENT_ID);
  });

  it('makes an agent and its links, and guards each change by the row as loaded', async () => {
    await expect(createAgent(client, { name: 'Clerk', rotation_id: null })).resolves.toMatchObject({
      id: 'agent-1',
      name: 'Clerk',
      favourite: false,
    });
    await grantAbility(client, AGENT_ID, 'ab-email');
    await addShortTermMemory(client, AGENT_ID, 'audience', 'Engineers.');
    await linkContextPrompt(client, AGENT_ID, 'brief');
    await seatInConversation(client, AGENT_ID, 'notes', true);
    const agent = renderHook(() => useAgentActions(AGENT_ID), { wrapper: TestWrapper }).result;
    const helper = renderHook(() => useAgentActions('helper'), { wrapper: TestWrapper }).result;
    const grants = renderHook(() => useAgentAbilityActions(AGENT_ID), { wrapper: TestWrapper }).result;
    const memories = renderHook(() => useShortTermMemoryActions(AGENT_ID), { wrapper: TestWrapper }).result;
    const seats = renderHook(() => useConversationSeatActions(AGENT_ID), { wrapper: TestWrapper }).result;
    const prompts = renderHook(() => useAgentContextPromptActions(AGENT_ID), { wrapper: TestWrapper }).result;
    await expect(agent.current.update.save(rowOf(store.agents, AGENT_ID), { name: 'Archivist' })).resolves.toBe(true);
    await expect(helper.current.remove.save(rowOf(store.agents, 'helper'), {})).resolves.toBe(true);
    await expect(grants.current.update.save(rowOf(store.grants, GRANT_ID), { enabled: false })).resolves.toBe(true);
    await expect(memories.current.remove.save(rowOf(store.workingMemory, 'wm-tone'), {})).resolves.toBe(true);
    await expect(seats.current.update.save(rowOf(store.seats, 'seat-1'), { auto_respond: true })).resolves.toBe(true);
    await expect(prompts.current.remove.save(rowOf(store.agentPrompts, 'acp-1'), {})).resolves.toBe(true);
    expect(writesOf(calls)).toEqual([
      ['POST', '/v1/agent', '{"agent":{"name":"Clerk","rotation_id":null}}', null],
      ['POST', '/v1/agent-ability', '{"agent_ability":{"agent_id":"scribe","ability_id":"ab-email","enabled":true}}', null],
      ['POST', '/v1/agent-memory', '{"agent_memory":{"agent_id":"scribe","key":"audience","content":"Engineers."}}', null],
      ['POST', '/v1/agent_context_prompt', '{"agent_context_prompt":{"agent_id":"scribe","prompt_id":"brief"}}', null],
      [
        'POST',
        '/v1/conversation_agent',
        '{"conversation_agent":{"agent_id":"scribe","conversation_id":"notes","active":true,"auto_respond":true}}',
        null,
      ],
      ['PUT', '/v1/agent/scribe', '{"agent":{"name":"Archivist"}}', LOADED],
      ['DELETE', '/v1/agent/helper', undefined, LOADED],
      ['PUT', `/v1/agent-ability/${GRANT_ID}`, '{"agent_ability":{"enabled":false}}', LOADED],
      ['DELETE', '/v1/agent-memory/wm-tone', undefined, LOADED],
      ['PUT', '/v1/conversation_agent/seat-1', '{"conversation_agent":{"auto_respond":true}}', LOADED],
      ['DELETE', '/v1/agent_context_prompt/acp-1', undefined, LOADED],
    ]);
  });
});
