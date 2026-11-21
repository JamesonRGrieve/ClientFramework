// SPDX-License-Identifier: AGPL-3.0-or-later
import { NextRequest } from 'next/server.js';
import { describe, expect, it } from 'vitest';
import { ApiError } from './apiErrors';
import { LOCAL_OWNER_ID, localOwner } from './localOwner';

const THING_URL = 'http://localhost/api/v1/thing';

function request(method: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(THING_URL, { method, headers });
}

function refusal(run: () => void): ApiError {
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
      localOwner(new NextRequest(THING_URL, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hello' })),
    );
    expect([refused.status, refused.detail, refused.extra]).toEqual([
      415,
      'Unsupported Media Type',
      { supported: ['application/json'] },
    ]);
    expect(localOwner(request('DELETE')).id).toBe(LOCAL_OWNER_ID);
  });

  it('takes a raw body of a media type the route names, and refuses others with 415 naming them', () => {
    const pictures = ['image/png', 'application/pdf'];
    const upload = (type: string): NextRequest =>
      new NextRequest(THING_URL, {
        method: 'POST',
        headers: { 'sec-fetch-site': 'same-origin', 'content-type': type },
        body: 'png!',
      });
    expect(localOwner(upload('image/png'), pictures).id).toBe(LOCAL_OWNER_ID);
    const refused = refusal(() => localOwner(upload('application/json'), pictures));
    expect([refused.status, refused.extra]).toEqual([415, { supported: pictures }]);
    const crossSite = refusal(() =>
      localOwner(
        new NextRequest(THING_URL, {
          method: 'POST',
          headers: { 'sec-fetch-site': 'cross-site', 'content-type': 'image/png' },
        }),
        pictures,
      ),
    );
    expect(crossSite.status).toBe(403);
  });
});
