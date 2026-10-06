// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { loaded, TestWrapper, testConfig } from 'zephyrex/testing';
import { type Call, rowOf, writesOf } from 'zephyrex/testing/msw';
import { CHAIN_ID, chainsFixture, FIXTURE_VERSION, RUN_ID } from './chains.mocks';
import {
  addStep,
  cancelRun,
  createChain,
  runChain,
  useChain,
  useChainActions,
  useChainRuns,
  useChains,
  useChainStepActions,
  useChainSteps,
  useStepResults,
} from './chainsApi';
import { NEW_STEP, stepFields } from './stepModel';
import { recordCalls } from './testing.mocks';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });
const LOADED = `"${FIXTURE_VERSION}"`;

const idsOf = (rows: readonly { id: string }[] | undefined): string[] | undefined => rows?.map(({ id }) => id);

describe('the chains API', () => {
  let store = chainsFixture();
  let calls: Call[] = [];

  beforeEach(() => {
    store = chainsFixture();
    calls = recordCalls(store);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the chains favourites first, one chain or null, its steps in run order, its runs newest first and a run’s steps in order', async () => {
    store.steps = [...store.steps].reverse();
    store.results = [...store.results].reverse();
    expect(idsOf(await loaded(() => useChains()))).toEqual([CHAIN_ID, 'empty']);
    expect(await loaded(() => useChain('gone'))).toBeNull();
    expect(idsOf(await loaded(() => useChainSteps(CHAIN_ID)))).toEqual(['s-search', 's-check', 's-sum', 's-done']);
    expect(idsOf(await loaded(() => useChainRuns(CHAIN_ID)))).toEqual(['run-3', 'run-2', RUN_ID]);
    expect((await loaded(() => useStepResults(RUN_ID))).map(({ sequence }) => sequence)).toEqual([1, 2, 3]);
  });

  it('makes a chain and a step, runs it, stops a run, and guards each change by the row as loaded', async () => {
    await expect(createChain(client, { name: 'Weekly', description: null })).resolves.toMatchObject({
      id: 'chain-1',
      max_steps: 100,
      favourite: false,
    });
    const fields = stepFields({
      ...NEW_STEP,
      name: 'greet',
      kind: 'set',
      expression: '"hi"',
      variable: 'greeting',
      position: '4',
    });
    await addStep(client, CHAIN_ID, fields);
    await expect(runChain(client, CHAIN_ID, { topic: 'rust' })).resolves.toMatchObject({
      status: 'succeeded',
      inputs: { topic: 'rust' },
    });
    await expect(cancelRun(client, 'run-3', 'Too slow')).resolves.toMatchObject({ cancel_requested: true });
    const chain = renderHook(() => useChainActions(CHAIN_ID), { wrapper: TestWrapper }).result;
    const blank = renderHook(() => useChainActions('empty'), { wrapper: TestWrapper }).result;
    const steps = renderHook(() => useChainStepActions(CHAIN_ID), { wrapper: TestWrapper }).result;
    await expect(chain.current.update.save(rowOf(store.chains, CHAIN_ID), { max_steps: 50 })).resolves.toBe(true);
    await expect(blank.current.remove.save(rowOf(store.chains, 'empty'), {})).resolves.toBe(true);
    await expect(steps.current.update.save(rowOf(store.steps, 's-check'), { max_loops: 5 })).resolves.toBe(true);
    await expect(steps.current.remove.save(rowOf(store.steps, 's-done'), {})).resolves.toBe(true);
    expect(writesOf(calls)).toEqual([
      ['POST', '/v1/chain', '{"chain":{"name":"Weekly","description":null}}', null],
      ['POST', '/v1/chain-step', JSON.stringify({ chain_step: { chain_id: CHAIN_ID, ...fields } }), null],
      ['POST', `/v1/chain/${CHAIN_ID}/run`, '{"inputs":{"topic":"rust"}}', null],
      ['POST', '/v1/chain-run/run-3/cancel', '{"reason":"Too slow"}', null],
      ['PUT', `/v1/chain/${CHAIN_ID}`, '{"chain":{"max_steps":50}}', LOADED],
      ['DELETE', '/v1/chain/empty', undefined, LOADED],
      ['PUT', '/v1/chain-step/s-check', '{"chain_step":{"max_loops":5}}', LOADED],
      ['DELETE', '/v1/chain-step/s-done', undefined, LOADED],
    ]);
  });
});
