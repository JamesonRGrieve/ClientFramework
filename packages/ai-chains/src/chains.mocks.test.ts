// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom, rowOf } from 'zephyrex/testing/msw';
import { CHAIN_ID, chainHandlers, chainsFixture } from './chains.mocks';
import { ChainRunSchema } from './chainsApi';

const BASE = 'http://localhost:1996';
const HTTP_NOT_FOUND = 404;

const post = (body: object): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

describe('the mock chains server', () => {
  it('runs a chain there is through its steps, handing back its inputs as its variables', async () => {
    const store = chainsFixture();
    const serve = fetchFrom(chainHandlers(store));
    expect((await serve(`${BASE}/v1/chain/gone/run`, post({ inputs: {} }))).status).toBe(HTTP_NOT_FOUND);
    const ran = ChainRunSchema.parse(
      await (await serve(`${BASE}/v1/chain/${CHAIN_ID}/run`, post({ inputs: { a: 1 } }))).json(),
    );
    expect(ran).toMatchObject({
      chain_id: CHAIN_ID,
      status: 'succeeded',
      steps_executed: 4,
      variables: { a: 1 },
      output: '"Done."',
    });
    const empty = ChainRunSchema.parse(await (await serve(`${BASE}/v1/chain/empty/run`, post({ inputs: {} }))).json());
    expect(empty).toMatchObject({ steps_executed: 0, output: null });
    expect(store.runs.map(({ id }) => id)).toContain('run-new-2');
  });

  it('stops a pending run at once, and only asks a running one to stop', async () => {
    const store = chainsFixture();
    store.runs.push({ ...rowOf(store.runs, 'run-3'), id: 'waiting', status: 'pending' });
    const serve = fetchFrom(chainHandlers(store));
    expect((await serve(`${BASE}/v1/chain-run/gone/cancel`, post({ reason: null }))).status).toBe(HTTP_NOT_FOUND);
    await serve(`${BASE}/v1/chain-run/waiting/cancel`, post({ reason: null }));
    await serve(`${BASE}/v1/chain-run/run-3/cancel`, post({ reason: null }));
    expect(rowOf(store.runs, 'waiting')).toMatchObject({ status: 'cancelled', cancel_requested: true });
    expect(rowOf(store.runs, 'run-3')).toMatchObject({ status: 'running', cancel_requested: true });
  });
});
