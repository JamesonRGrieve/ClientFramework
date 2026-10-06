// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { loaded, TestWrapper, testConfig } from 'zephyrex/testing';
import { type Call, rowOf, writesOf } from 'zephyrex/testing/msw';
import { AGENT_ID, agentsFixture, FIXTURE_VERSION, TURN_ID } from './agents.mocks';
import { recordCalls } from './testing.mocks';
import { NEW_TRIGGER, triggerFields } from './triggerModel';
import {
  type Activity,
  activityNodes,
  type ActivityNode,
  createTrigger,
  newWebhookSecret,
  takeTurn,
  useActivityTree,
  useTriggerActions,
  useTriggers,
  useTurns,
} from './triggersApi';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });
const LOADED = `"${FIXTURE_VERSION}"`;

const activity = (id: string, createdAt: string): Activity => ({ id, title: id, body: '', created_at: createdAt });
const titles = (nodes: readonly ActivityNode[]): unknown[] =>
  nodes.map(({ activity: { title }, children }) => [title, titles(children)]);

describe('activityNodes', () => {
  it('turns the server’s tree into nodes, oldest first at each level', () => {
    const tree = {
      late: { activity: activity('late', '2026-10-01T09:00:05'), children: {} },
      early: {
        activity: activity('early', '2026-10-01T09:00:01'),
        children: {
          second: { activity: activity('second', '2026-10-01T09:00:03'), children: {} },
          first: { activity: activity('first', '2026-10-01T09:00:02'), children: {} },
        },
      },
    };
    expect(titles(activityNodes(tree))).toEqual([
      [
        'early',
        [
          ['first', []],
          ['second', []],
        ],
      ],
      ['late', []],
    ]);
  });
});

describe('the triggers API', () => {
  let store = agentsFixture();
  let calls: Call[] = [];

  beforeEach(() => {
    store = agentsFixture();
    calls = recordCalls(store);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the agent’s triggers, its turns newest first, and a turn’s activities as a tree', async () => {
    expect((await loaded(() => useTriggers(AGENT_ID))).map(({ id }) => id)).toEqual(['every-monday', 'hook']);
    expect((await loaded(() => useTurns(AGENT_ID))).map(({ id }) => id)).toEqual(['turn-2', TURN_ID]);
    expect(titles(await loaded(() => useActivityTree(TURN_ID)))).toEqual([['Searched the web', [['Read a page', []]]]]);
  });

  it('makes a trigger, a webhook secret and a turn, and guards each change by the trigger as loaded', async () => {
    const fields = triggerFields({ ...NEW_TRIGGER, cron: '0 8 * * *', instructions: 'Read the news.' });
    await expect(createTrigger(client, AGENT_ID, fields)).resolves.toMatchObject({
      id: 'invocation_trigger-1',
      cron: '0 8 * * *',
      fire_count: 0,
    });
    await expect(newWebhookSecret(client, 'hook')).resolves.toMatchObject({
      trigger_id: 'hook',
      secret: 'whsec-shown-once',
    });
    await expect(takeTurn(client, AGENT_ID, 'Go')).resolves.toMatchObject({ status: 'succeeded', payload: 'Go' });
    const actions = renderHook(() => useTriggerActions(AGENT_ID), { wrapper: TestWrapper }).result;
    await expect(actions.current.update.save(rowOf(store.triggers, 'every-monday'), { enabled: false })).resolves.toBe(true);
    await expect(actions.current.remove.save(rowOf(store.triggers, 'hook'), {})).resolves.toBe(true);
    expect(writesOf(calls)).toEqual([
      ['POST', '/v1/invocation-trigger', JSON.stringify({ invocation_trigger: { agent_id: AGENT_ID, ...fields } }), null],
      ['POST', '/v1/invocation-trigger/hook/webhook-secret', '{}', null],
      ['POST', `/v1/agent/${AGENT_ID}/turn`, '{"payload":"Go"}', null],
      ['PUT', '/v1/invocation-trigger/every-monday', '{"invocation_trigger":{"enabled":false}}', LOADED],
      ['DELETE', '/v1/invocation-trigger/hook', undefined, LOADED],
    ]);
  });
});
