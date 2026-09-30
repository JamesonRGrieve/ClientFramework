// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { extractCorrelationId, mintTraceparent, parseDeprecation, parseRateLimit } from './headers';

describe('parseDeprecation', () => {
  it('is undefined when neither header is sent, or both are empty', () => {
    expect(parseDeprecation(new Headers(), '/v1/x')).toBeUndefined();
    expect(parseDeprecation(new Headers({ deprecation: '', sunset: '' }), '/v1/x')).toBeUndefined();
  });

  it('reports whichever headers are sent', () => {
    expect(parseDeprecation(new Headers({ sunset: 'Wed, 01 Jan 2031 00:00:00 GMT' }), '/v1/x')).toEqual({
      resource: '/v1/x',
      deprecation: undefined,
      sunset: 'Wed, 01 Jan 2031 00:00:00 GMT',
    });
  });
});

describe('parseRateLimit', () => {
  it('is undefined without rate-limit headers', () => {
    expect(parseRateLimit(new Headers())).toBeUndefined();
  });

  it('reads the numbers, leaving out what is missing or unreadable', () => {
    const headers = new Headers({ 'x-ratelimit-limit': '100', 'x-ratelimit-remaining': 'soon', 'retry-after': '30' });
    expect(parseRateLimit(headers)).toEqual({ limit: 100, remaining: undefined, reset: undefined, retryAfter: 30 });
  });
});

describe('mintTraceparent', () => {
  it('is a sampled W3C traceparent with fresh ids', () => {
    const first = mintTraceparent();
    expect(first).toMatch(/^00-[\da-f]{32}-[\da-f]{16}-01$/);
    expect(mintTraceparent()).not.toBe(first);
  });
});

describe('extractCorrelationId', () => {
  it('prefers x-correlation-id, then the traceparent trace id', () => {
    const traceparent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
    expect(extractCorrelationId(new Headers({ 'x-correlation-id': 'c-1', traceparent }))).toBe('c-1');
    expect(extractCorrelationId(new Headers({ traceparent }))).toBe('0af7651916cd43dd8448eb211c80319c');
    expect(extractCorrelationId(new Headers())).toBeUndefined();
  });
});
