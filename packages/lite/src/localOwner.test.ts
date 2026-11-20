// SPDX-License-Identifier: AGPL-3.0-or-later
import { NextRequest } from 'next/server.js';
import { describe, expect, it } from 'vitest';
import { ApiError } from './apiErrors';
import { LOCAL_OWNER_ID, localOwner } from './localOwner';

const URL = 'http://localhost/api/v1/thing';

function request(method: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(URL, { method, headers });
}

function refusal(run: () => unknown): ApiError {
  try {
    run();
  } catch (error) {
    if (error instanceof ApiError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected a refusal');
}

describe('localOwner', () => {
  it('answers every read with the one local owner', () => {
    expect(localOwner(request('GET'))).toEqual({ id: LOCAL_OWNER_ID });
  });

  it('accepts a same-origin JSON write', () => {
    const owner = localOwner(
      request('POST', { 'sec-fetch-site': 'same-origin', 'content-type': 'application/json; charset=utf-8' }),
    );
    expect(owner.id).toBe(LOCAL_OWNER_ID);
  });

  it('refuses a cross-site write with 403', () => {
    const error = refusal(() =>
      localOwner(request('PUT', { 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' })),
    );
    expect(error.status).toBe(403);
  });

  it('leaves a write with no body to the 422 that follows, as the server does', () => {
    expect(localOwner(new NextRequest('http://localhost/api/v1/thing', { method: 'POST' }))).toEqual({ id: LOCAL_OWNER_ID });
  });

  it('refuses a write that is not JSON with 415, but lets a DELETE carry no body', () => {
    const refused = refusal(() =>
      localOwner(new NextRequest(URL, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hello' })),
    );
    expect([refused.status, refused.detail, refused.extra]).toEqual([
      415,
      'Unsupported Media Type',
      { supported: ['application/json'] },
    ]);
    expect(localOwner(request('DELETE')).id).toBe(LOCAL_OWNER_ID);
  });
});
