// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom, rowOf } from 'zephyrex/testing/msw';
import { AGENT_ID, agentHandlers, agentsFixture, FIXTURE_VERSION, TURN_ID } from './agents.mocks';

const BASE = 'http://localhost:1996';
const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;
const HTTP_PRECONDITION_FAILED = 412;
const HTTP_PRECONDITION_REQUIRED = 428;
const LOADED = `"${FIXTURE_VERSION}"`;

const request = (method: string, body?: object, ifMatch?: string): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  headers: ifMatch === undefined ? {} : { 'If-Match': ifMatch },
});

describe('the mock agents server', () => {
  it('holds a change to the row’s version', async () => {
    const serve = fetchFrom(agentHandlers());
    const url = `${BASE}/v1/agent/${AGENT_ID}`;
    const rename = { agent: { name: 'Clerk' } };
    expect((await serve(url, request('PUT', rename))).status).toBe(HTTP_PRECONDITION_REQUIRED);
    expect((await serve(url, request('PUT', rename, LOADED))).status).toBe(HTTP_OK);
    expect((await serve(url, request('PUT', rename, LOADED))).status).toBe(HTTP_PRECONDITION_FAILED);
    expect((await serve(`${BASE}/v1/agent/gone`, request('DELETE', undefined, LOADED))).status).toBe(HTTP_NOT_FOUND);
  });

  it('lists only the rows a filter names, and sets what the server would on a new row', async () => {
    const store = agentsFixture();
    const serve = fetchFrom(agentHandlers(store));
    const listed = await serve(`${BASE}/v1/invocation-trigger?agent_id=helper`, request('GET'));
    await expect(listed.json()).resolves.toEqual({ invocation_triggers: [] });
    const made = await serve(`${BASE}/v1/agent`, request('POST', { agent: { name: 'Clerk', rotation_id: null } }));
    expect(made.status).toBe(HTTP_CREATED);
    expect(rowOf(store.agents, 'agent-1')).toMatchObject({ name: 'Clerk', favourite: false, user_id: 'u-me' });
  });

  it('runs a turn of an agent there is, and serves a turn’s activities nested', async () => {
    const store = agentsFixture();
    const serve = fetchFrom(agentHandlers(store));
    expect((await serve(`${BASE}/v1/agent/gone/turn`, request('POST', { payload: null }))).status).toBe(HTTP_NOT_FOUND);
    expect((await serve(`${BASE}/v1/agent/${AGENT_ID}/turn`, request('POST', {}))).status).toBe(HTTP_OK);
    expect(rowOf(store.turns, 'turn-new-1')).toMatchObject({ agent_id: AGENT_ID, payload: null, status: 'succeeded' });
    const tree = await serve(`${BASE}/v1/activity/hierarchy/${TURN_ID}`, request('GET'));
    await expect(tree.json()).resolves.toMatchObject({
      activities: { 'act-search': { children: { 'act-page': { children: {} } } } },
    });
  });
});
