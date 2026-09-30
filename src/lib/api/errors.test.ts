// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { ApiError, parseErrorResponse } from './errors';

const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_BAD_GATEWAY = 502;

describe('parseErrorResponse', () => {
  it('reads the error envelope', async () => {
    const response = new Response(JSON.stringify({ detail: 'Token expired', code: 'auth.expired' }), {
      status: HTTP_UNAUTHORIZED,
      statusText: 'Unauthorized',
    });
    const error = await parseErrorResponse(response, 'c-1');
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Token expired');
    expect(error.code).toBe('auth.expired');
    expect(error.correlationId).toBe('c-1');
    expect(error.isUnauthorized()).toBe(true);
  });

  it('keeps a structured detail, and falls back to the status text when there is none', async () => {
    const structured = await parseErrorResponse(
      new Response(JSON.stringify({ detail: { field: 'email' } }), { status: HTTP_UNAUTHORIZED }),
    );
    expect(structured.detail).toEqual({ field: 'email' });
    const bare = await parseErrorResponse(
      new Response(JSON.stringify({ unrelated: true }), { status: HTTP_UNAUTHORIZED, statusText: 'Unauthorized' }),
    );
    expect(bare.detail).toBe('Unauthorized');
  });

  it('uses a plain-text body as the detail', async () => {
    const error = await parseErrorResponse(new Response('upstream down', { status: HTTP_BAD_GATEWAY }));
    expect(error.detail).toBe('upstream down');
    expect(error.isServerError()).toBe(true);
  });

  it('reads Retry-After in seconds, ignoring a date or junk', async () => {
    const limited = await parseErrorResponse(
      new Response('{}', { status: HTTP_TOO_MANY_REQUESTS, headers: { 'retry-after': '12' } }),
    );
    expect(limited.retryAfter).toBe(12);
    expect(limited.isRateLimited()).toBe(true);
    const junk = await parseErrorResponse(
      new Response('{}', { status: HTTP_TOO_MANY_REQUESTS, headers: { 'retry-after': 'later' } }),
    );
    expect(junk.retryAfter).toBeUndefined();
  });
});
