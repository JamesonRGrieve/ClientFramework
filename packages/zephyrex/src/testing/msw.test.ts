// SPDX-License-Identifier: AGPL-3.0-or-later
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { fetchFrom, refuseStale, versionStamp } from './msw';

const BASE = 'http://localhost:1996';

describe('fetchFrom', () => {
  const answer = fetchFrom([
    http.get('*/v1/thing/:id', ({ params }) => HttpResponse.json({ id: params['id'] })),
    http.post('*/v1/thing', async ({ request }) => HttpResponse.json(await request.json(), { status: 201 })),
  ]);

  it('answers a request from the handler that matches it, with its params and body', async () => {
    await expect((await answer(`${BASE}/v1/thing/t1`)).json()).resolves.toEqual({ id: 't1' });
    const created = await answer(`${BASE}/v1/thing`, { method: 'POST', body: '{"name":"Ada"}' });
    expect(created.status).toBe(201);
    await expect(created.json()).resolves.toEqual({ name: 'Ada' });
  });

  it('takes a Request as well as a URL', async () => {
    await expect((await answer(new Request(`${BASE}/v1/thing/t2`))).json()).resolves.toEqual({ id: 't2' });
  });

  it('answers anything no handler matches with an empty object', async () => {
    const unmatched = await answer(`${BASE}/v1/elsewhere`);
    expect(unmatched.status).toBe(200);
    await expect(unmatched.json()).resolves.toEqual({});
  });
});

describe('versionStamp', () => {
  it('stamps UTC to the microsecond with no zone, as the server does, each later than the last', () => {
    const stamps = [versionStamp(), versionStamp(), versionStamp()];
    for (const stamp of stamps) {
      expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/);
    }
    expect(new Set(stamps).size).toBe(stamps.length);
    expect([...stamps].sort()).toEqual(stamps);
  });
});

describe('refuseStale', () => {
  const row = { id: 't1', updated_at: '2026-10-03T18:04:05.678000' };
  const change = (ifMatch: string | null): Request =>
    new Request(`${BASE}/v1/thing/t1`, { method: 'PUT', headers: ifMatch === null ? {} : { 'If-Match': ifMatch } });

  it("lets a change through when it names the row's current version", () => {
    expect(refuseStale(change('"2026-10-03T18:04:05.678000"'), row)).toBeNull();
  });

  it('refuses an older version with 412 and the row as it is now', async () => {
    const refused = refuseStale(change('"2026-10-03T18:00:00.000000"'), row);
    expect(refused?.status).toBe(412);
    await expect(refused?.json()).resolves.toMatchObject({ current: row });
  });

  it('refuses a change that names no version with 428', async () => {
    const refused = refuseStale(change(null), row);
    expect(refused?.status).toBe(428);
    await expect(refused?.json()).resolves.toEqual({ detail: 'If-Match required' });
  });
});
