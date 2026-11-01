// SPDX-License-Identifier: AGPL-3.0-or-later
import { type RenderHookResult, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper, withSession } from 'zephyrex/testing';
import { type Call, recordingFetch, rowOf, writesOf } from 'zephyrex/testing/msw';
import { ALEX, FIXTURE_VERSION, ME, rotaFixture, rotaHandlers, type RotaStore, SAM } from './rota.mocks';
import { type RotaActions, useMyRotas, useRotaActions, useSchedule, useSwaps } from './rotaApi';
import type { Rota, ScheduledNight, Swap } from './rotaModel';

interface Reads {
  rotas: Rota[] | undefined;
  schedule: ScheduledNight[] | undefined;
  swaps: Swap[] | undefined;
  act: RotaActions;
}

// Each read's data is taken while rendering: SWR re-renders only for what a render used.
function useReads(): Reads {
  return {
    rotas: useMyRotas().data,
    schedule: useSchedule('r1', '2026-10-06', 2).data,
    swaps: useSwaps('r1').data,
    act: useRotaActions(),
  };
}

function serve(): { store: RotaStore; calls: Call[]; hook: RenderHookResult<Reads, unknown> } {
  withSession();
  const store = rotaFixture();
  const recorder = recordingFetch(rotaHandlers(store));
  vi.stubGlobal('fetch', vi.fn(recorder.fetch));
  const hook = renderHook(useReads, { wrapper: TestWrapper });
  return { store, calls: recorder.calls, hook };
}

describe('the rota reads and writes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the rotas, a window of the schedule and the swaps', async () => {
    const { hook } = serve();
    await waitFor(() => expect(hook.result.current.schedule).toHaveLength(2));
    expect(hook.result.current.schedule?.map((night) => night.user_id)).toEqual([ALEX, SAM]);
    await waitFor(() => expect(hook.result.current.rotas?.[0]?.name).toBe('Nights'));
    await waitFor(() => expect(hook.result.current.swaps?.[0]?.status).toBe('pending'));
  });

  it('gives an open night, changes one guarded by its version, and leaves one open', async () => {
    const { store, calls, hook } = serve();
    await waitFor(() => expect(hook.result.current.rotas).toHaveLength(1));
    const rota = rowOf(hook.result.current.rotas ?? [], 'r1');
    await hook.result.current.act.setNight(rota, 3, SAM);
    await hook.result.current.act.setNight(rota, 0, SAM);
    await hook.result.current.act.setNight(rota, 2, null);
    await hook.result.current.act.setNight(rota, 1, SAM);
    expect(writesOf(calls).map(([method, path, , ifMatch]) => [method, path, ifMatch])).toEqual([
      ['POST', '/v1/rota_night', null],
      ['PUT', '/v1/rota_night/n0', `"${FIXTURE_VERSION}"`],
      ['DELETE', '/v1/rota_night/n2', `"${FIXTURE_VERSION}"`],
    ]);
    expect(
      store.nights.map((night) => `${String(night.day_index)}:${night.user_id}`).sort((a, b) => a.localeCompare(b)),
    ).toEqual([`0:${SAM}`, `1:${SAM}`, `3:${SAM}`]);
  });

  it('accepts a swap, and the schedule it moved refreshes', async () => {
    const { hook } = serve();
    await waitFor(() => expect(hook.result.current.swaps).toHaveLength(1));
    const rota = rowOf(hook.result.current.rotas ?? [], 'r1');
    await hook.result.current.act.answerSwap(rota, rowOf(hook.result.current.swaps ?? [], 's1'), true);
    await waitFor(() => expect(hook.result.current.schedule?.[0]).toMatchObject({ user_id: ME, swapped: true }));
  });

  it('asks for a night and starts a rota', async () => {
    const { store, hook } = serve();
    await waitFor(() => expect(hook.result.current.rotas).toHaveLength(1));
    await hook.result.current.act.askSwap(rowOf(hook.result.current.rotas ?? [], 'r1'), '2026-10-07', ME);
    await waitFor(() => expect(hook.result.current.swaps).toHaveLength(2));
    const id = await hook.result.current.act.create({ name: 'Weekends', cycle_days: 7, starts_on: '2026-10-03' });
    expect(store.rotas.map((rota) => rota.id)).toContain(id);
    await waitFor(() => expect(hook.result.current.rotas).toHaveLength(2));
  });
});
