// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom, rowOf } from 'zephyrex/testing/msw';
import { ALEX, emptyRotaStore, FIXTURE_VERSION, ME, rotaFixture, rotaHandlers, SAM, scheduleOf } from './rota.mocks';

const BASE = 'http://localhost:1996';
const post = (body: object): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

describe('the mock rota server', () => {
  it('repeats the cycle from its first night, and moves a night once a swap is accepted', () => {
    const store = rotaFixture();
    expect(scheduleOf(store, 'r1', '2026-09-27', 6).map((night) => night.user_id)).toEqual([
      null,
      ALEX,
      SAM,
      ALEX,
      null,
      ALEX,
    ]);
    rowOf(store.swaps, 's1').status = 'accepted';
    expect(scheduleOf(store, 'r1', '2026-10-06', 1)).toEqual([{ night: '2026-10-06', user_id: ME, swapped: true }]);
  });

  it('shows a rota to its members only', async () => {
    const store = rotaFixture();
    const send = fetchFrom(rotaHandlers(store));
    await expect((await send(`${BASE}/v1/rotas/mine`)).json()).resolves.toMatchObject({ rotas: [{ id: 'r1' }] });
    store.me = 'u-stranger';
    await expect((await send(`${BASE}/v1/rotas/mine`)).json()).resolves.toEqual({ rotas: [] });
    expect((await send(`${BASE}/v1/rotas/r1/schedule`)).status).toBe(404);
  });

  it('lets only the owner set nights, one person to a night', async () => {
    const store = rotaFixture();
    const send = fetchFrom(rotaHandlers(store));
    const night = (dayIndex: number): RequestInit =>
      post({ rota_night: { rota_id: 'r1', day_index: dayIndex, user_id: SAM } });
    expect((await send(`${BASE}/v1/rota_night`, night(0))).status).toBe(409);
    expect((await send(`${BASE}/v1/rota_night`, night(4))).status).toBe(422);
    expect((await send(`${BASE}/v1/rota_night`, night(3))).status).toBe(201);
    const change = { method: 'PUT', body: JSON.stringify({ rota_night: { user_id: SAM } }) };
    expect((await send(`${BASE}/v1/rota_night/n0`, change)).status).toBe(428);
    const guarded = { ...change, headers: { 'If-Match': `"${FIXTURE_VERSION}"` } };
    expect((await send(`${BASE}/v1/rota_night/n0`, guarded)).status).toBe(200);
    store.me = ALEX;
    expect((await send(`${BASE}/v1/rota_night/n1`, guarded)).status).toBe(404);
  });

  it('needs the other of the two to answer a swap', async () => {
    const store = rotaFixture();
    const send = fetchFrom(rotaHandlers(store));
    expect((await send(`${BASE}/v1/rotas/r1/swaps`, post({ night: '2026-10-07', to_user_id: SAM }))).status).toBe(422);
    const asked = await send(`${BASE}/v1/rotas/r1/swaps`, post({ night: '2026-10-07', to_user_id: ME }));
    const { id } = (await asked.json()) as { id: string };
    expect((await send(`${BASE}/v1/rotas/swaps/${id}/answer`, post({ accept: true }))).status).toBe(403);
    store.me = SAM;
    expect((await send(`${BASE}/v1/rotas/swaps/${id}/answer`, post({ accept: false }))).status).toBe(200);
    expect((await send(`${BASE}/v1/rotas/swaps/${id}/answer`, post({ accept: true }))).status).toBe(409);
  });

  it('starts a rota, and refuses one with no name', async () => {
    const store = emptyRotaStore();
    const send = fetchFrom(rotaHandlers(store));
    const rota = { name: 'Weekends', cycle_days: 7, starts_on: '2026-10-03' };
    expect((await send(`${BASE}/v1/rota`, post({ rota }))).status).toBe(201);
    expect((await send(`${BASE}/v1/rota`, post({ rota: { ...rota, name: '' } }))).status).toBe(422);
    expect(store.rotas.map((made) => made.name)).toEqual(['Weekends']);
  });
});
