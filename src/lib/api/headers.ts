import type { DeprecationInfo, RateLimitInfo } from './types';

const HEX_BYTE_LENGTH = 2;
const TRACE_ID_BYTES = 16;
const SPAN_ID_BYTES = 8;

export function parseDeprecation(headers: Headers, resource: string): DeprecationInfo | undefined {
  const deprecation = headers.get('deprecation') ?? undefined;
  const sunset = headers.get('sunset') ?? undefined;
  if (!deprecation && !sunset) return undefined;
  return { resource, deprecation, sunset };
}

export function parseRateLimit(headers: Headers): RateLimitInfo | undefined {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  const retryAfter = headers.get('retry-after');
  if (!limit && !remaining && !reset && !retryAfter) return undefined;
  return {
    limit: numberOrUndefined(limit),
    remaining: numberOrUndefined(remaining),
    reset: numberOrUndefined(reset),
    retryAfter: numberOrUndefined(retryAfter),
  };
}

const numberOrUndefined = (value: string | null): number | undefined => {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const randomHex = (bytes: number): string => {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(HEX_BYTE_LENGTH, '0')).join('');
};

/**
 * Mints a W3C traceparent header (00 version, sampled flag).
 * ServerFramework's RequestContext honours `traceparent` for correlation IDs.
 */
export function mintTraceparent(): string {
  return `00-${randomHex(TRACE_ID_BYTES)}-${randomHex(SPAN_ID_BYTES)}-01`;
}

export function extractCorrelationId(headers: Headers): string | undefined {
  const direct = headers.get('x-correlation-id');
  if (direct) return direct;
  const traceparent = headers.get('traceparent');
  if (!traceparent) return undefined;
  const parts = traceparent.split('-');
  return parts[1];
}
