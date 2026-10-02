// SPDX-License-Identifier: AGPL-3.0-or-later
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { fetchFrom } from './msw';

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
