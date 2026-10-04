// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom } from 'zephyrex/testing/msw';
import { FIXTURE_VERSION, healthFixture, healthHandlers, nightMinutes } from './health.mocks';

const BASE = 'http://localhost:1996';
const HTTP_NOT_FOUND = 404;
const HTTP_PRECONDITION_REQUIRED = 428;
const HTTP_UNPROCESSABLE = 422;

const put = (body: object, ifMatch?: string): RequestInit => ({
  method: 'PUT',
  body: JSON.stringify(body),
  headers: ifMatch === undefined ? {} : { 'If-Match': ifMatch },
});

describe('the mock health server', () => {
  it('lists each log in its envelope', async () => {
    const send = fetchFrom(healthHandlers());
    await expect((await send(`${BASE}/v1/health_weight`)).json()).resolves.toMatchObject({
      health_weights: [{ id: 'w1' }, { id: 'w2' }],
    });
    expect((await send(`${BASE}/v1/health_meal/gone`, put({}))).status).toBe(HTTP_NOT_FOUND);
  });

  it('holds a change to the record’s version', async () => {
    const send = fetchFrom(healthHandlers());
    expect((await send(`${BASE}/v1/health_weight/w1`, put({ health_weight: { weight_kg: 71 } }))).status).toBe(
      HTTP_PRECONDITION_REQUIRED,
    );
  });

  it('counts a night’s minutes, and refuses one that ends before it starts', async () => {
    const store = healthFixture();
    const send = fetchFrom(healthHandlers(store));
    const moved = await send(
      `${BASE}/v1/health_sleep/s1`,
      put({ health_sleep: { wake_time: '2026-09-30T07:00:00Z' } }, `"${FIXTURE_VERSION}"`),
    );
    await expect(moved.json()).resolves.toMatchObject({ health_sleep: { duration_minutes: 480 } });
    const backwards = await send(`${BASE}/v1/health_sleep`, {
      method: 'POST',
      body: JSON.stringify({ health_sleep: { bedtime: '2026-10-02T07:00:00Z', wake_time: '2026-10-01T23:00:00Z' } }),
    });
    expect(backwards.status).toBe(HTTP_UNPROCESSABLE);
    expect(store.sleeps).toHaveLength(1);
  });

  it('counts a night only when it ends after it starts, within a day', () => {
    const woke = '2026-09-30T06:30:00Z';
    expect(nightMinutes('2026-09-29T23:00:00Z', woke)).toBe(450);
    expect(nightMinutes(woke, '2026-09-29T23:00:00Z')).toBeNull();
    expect(nightMinutes('2026-09-28T06:30:00Z', woke)).toBeNull();
  });
});
