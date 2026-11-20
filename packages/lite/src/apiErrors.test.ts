// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiErrorResponse, logUnexpected, setErrorReporter } from './apiErrors';

describe('apiErrorResponse', () => {
  it('returns an ApiError as { detail } with its status', async () => {
    const res = apiErrorResponse(new ApiError(401, 'No authentication provided.'));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ detail: 'No authentication provided.' });
  });

  it('returns the opaque server-framework 500 body for any other error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = apiErrorResponse(new Error('connection to postgres://secret failed'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ detail: { message: 'Internal Server Error', code: 'internal_error' } });
    expect(JSON.stringify(body)).not.toContain('secret');
    spy.mockRestore();
  });

  it('keeps the precondition contract’s bare 428 string, as the framework answers it', async () => {
    const res = apiErrorResponse(new ApiError(428, 'If-Match required'));
    await expect(res.json()).resolves.toEqual({ detail: 'If-Match required' });
  });

  it('puts any other string detail in the framework’s envelope', async () => {
    const res = apiErrorResponse(new ApiError(403, 'Cross-site requests are refused'));
    await expect(res.json()).resolves.toEqual({ detail: { message: 'Cross-site requests are refused' } });
  });

  it('keeps the framework’s bare malformed-JSON detail', async () => {
    const res = apiErrorResponse(new ApiError(400, 'Invalid JSON syntax in request body'));
    await expect(res.json()).resolves.toEqual({ detail: 'Invalid JSON syntax in request body' });
  });

  it('answers 415 with the framework’s bare detail and what it supports beside it', async () => {
    const res = apiErrorResponse(new ApiError(415, 'Unsupported Media Type', { supported: ['application/json'] }));
    await expect(res.json()).resolves.toEqual({ detail: 'Unsupported Media Type', supported: ['application/json'] });
  });

  it('passes FastAPI’s request-validation list through as it is', async () => {
    const detail = [{ type: 'dict_type', loc: ['body'], msg: 'Input should be a valid dictionary', input: [1] }];
    await expect(apiErrorResponse(new ApiError(422, detail)).json()).resolves.toEqual({ detail });
  });
});

describe('unexpected errors are reported', () => {
  it('through zephyrex’s log by default, at the errors-only verbosity', () => {
    // zephyrex's log reads the client's setting where there is a window (these tests run in jsdom).
    vi.stubEnv('LOG_VERBOSITY_SERVER', '1');
    vi.stubEnv('NEXT_PUBLIC_LOG_VERBOSITY_CLIENT', '1');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = new Error('disk full');
    apiErrorResponse(error);
    expect(spy).toHaveBeenCalledWith(error);
    spy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('to the app’s own reporter in its place, and to nobody once it is cleared', () => {
    const report = vi.fn();
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    setErrorReporter(report);
    apiErrorResponse(new Error('one'));
    expect(report).toHaveBeenCalledTimes(1);
    setErrorReporter(undefined);
    apiErrorResponse(new Error('two'));
    expect(report).toHaveBeenCalledTimes(1);
    expect(spy).not.toHaveBeenCalled();
    setErrorReporter(logUnexpected);
    spy.mockRestore();
  });
});
