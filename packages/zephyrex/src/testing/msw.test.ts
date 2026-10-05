// SPDX-License-Identifier: AGPL-3.0-or-later
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { fetchFrom, notFound, recordingFetch, refuseStale, restTable, rowOf, versionStamp, writesOf } from './msw';

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

describe('notFound and rowOf', () => {
  it('answers 404 as the server does', async () => {
    const answer = notFound();
    expect(answer.status).toBe(404);
    await expect(answer.json()).resolves.toEqual({ detail: 'Not found' });
  });

  it('finds a fixture row by id, and names one that isn’t there as a mistake', () => {
    const rows = [{ id: 'a', n: 1 }];
    expect(rowOf(rows, 'a')).toEqual({ id: 'a', n: 1 });
    expect(() => rowOf(rows, 'gone')).toThrow('No row gone in the fixture');
  });
});

describe('recordingFetch and writesOf', () => {
  it('records each request answered, and picks out the writes with their path, body and If-Match', async () => {
    const { fetch: answer, calls } = recordingFetch([
      http.get('*/v1/thing', () => HttpResponse.json({ things: [] })),
      http.put('*/v1/thing/:id', () => HttpResponse.json({})),
    ]);
    await answer(`${BASE}/v1/thing`);
    await answer(`${BASE}/v1/thing/t1`, { method: 'PUT', body: '{"thing":{}}', headers: { 'If-Match': '"v"' } });
    expect(calls.map(({ url }) => url)).toEqual([`${BASE}/v1/thing`, `${BASE}/v1/thing/t1`]);
    expect(writesOf(calls)).toEqual([['PUT', '/v1/thing/t1', '{"thing":{}}', '"v"']]);
  });
});

describe('restTable', () => {
  const ThingSchema = z.object({
    id: z.string(),
    owner_id: z.string(),
    name: z.string(),
    done: z.boolean(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
  });
  type Thing = z.infer<typeof ThingSchema>;
  const LOADED = '2026-10-01T09:00:00.000001';
  const serve = (rows: Thing[]): { answer: typeof fetch; rows: () => Thing[] } => {
    let store = rows;
    const answer = fetchFrom(
      restTable({
        rows: () => store,
        set: (next) => (store = next),
        schema: ThingSchema,
        endpoint: '/v1/thing',
        single: 'thing',
        plural: 'things',
        filters: ['owner_id'],
        defaults: { done: false },
      }),
    );
    return { answer, rows: () => store };
  };
  const thing = (id: string, ownerId: string): Thing => ({
    id,
    owner_id: ownerId,
    name: id,
    done: false,
    created_at: LOADED,
    updated_at: null,
  });

  it('lists the rows a filter names, and gets one or 404', async () => {
    const { answer } = serve([thing('a', 'me'), thing('b', 'you')]);
    await expect((await answer(`${BASE}/v1/thing?owner_id=me`)).json()).resolves.toEqual({ things: [thing('a', 'me')] });
    await expect((await answer(`${BASE}/v1/thing`)).json()).resolves.toMatchObject({ things: [{ id: 'a' }, { id: 'b' }] });
    await expect((await answer(`${BASE}/v1/thing/b`)).json()).resolves.toEqual({ thing: thing('b', 'you') });
    expect((await answer(`${BASE}/v1/thing/gone`)).status).toBe(404);
  });

  it('makes a row from its body and the defaults, stamped as made now', async () => {
    const { answer, rows } = serve([]);
    const made = await answer(`${BASE}/v1/thing`, { method: 'POST', body: '{"thing":{"owner_id":"me","name":"New"}}' });
    expect(made.status).toBe(201);
    expect(rows()).toEqual([expect.objectContaining({ id: 'thing-1', name: 'New', done: false, updated_at: null })]);
  });

  it('holds a change or a delete to the row’s version', async () => {
    const { answer, rows } = serve([thing('a', 'me')]);
    const rename = (ifMatch: string): RequestInit => ({
      method: 'PUT',
      body: '{"thing":{"name":"Renamed"}}',
      headers: { 'If-Match': ifMatch },
    });
    expect((await answer(`${BASE}/v1/thing/a`, rename(`"${LOADED}"`))).status).toBe(200);
    expect((await answer(`${BASE}/v1/thing/a`, rename(`"${LOADED}"`))).status).toBe(412);
    expect((await answer(`${BASE}/v1/thing/gone`, rename(`"${LOADED}"`))).status).toBe(404);
    expect(rows()).toEqual([expect.objectContaining({ name: 'Renamed' })]);
    const remove = (ifMatch: string): RequestInit => ({ method: 'DELETE', headers: { 'If-Match': ifMatch } });
    expect((await answer(`${BASE}/v1/thing/a`, remove(`"${LOADED}"`))).status).toBe(412);
    expect((await answer(`${BASE}/v1/thing/gone`, remove(`"${LOADED}"`))).status).toBe(404);
    expect((await answer(`${BASE}/v1/thing/a`, remove(`"${String(rows().at(0)?.updated_at)}"`))).status).toBe(204);
    expect(rows()).toEqual([]);
  });
});
