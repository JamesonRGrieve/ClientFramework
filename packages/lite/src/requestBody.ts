// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiError, validationError } from './apiErrors';
import { STATUS } from './status';

/**
 * The largest body a request may carry: server-framework's cap (InboundSecurity
 * DEFAULT_MAX_BODY_BYTES), refused with the same 413 as soon as it is exceeded, so an
 * oversized body never sits in memory.
 */
export const MAX_BODY_BYTES = 10_485_760; // 10 MiB
const TOO_LARGE = 'Request body exceeds maximum allowed size';

/** The rest of the stream, refused the moment it passes the cap. */
async function collect(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  chunks: Uint8Array[],
  size: number,
): Promise<Uint8Array[]> {
  // A client that hangs up mid-body is not a server fault: refused like any unreadable body.
  const { done, value } = await reader.read().catch(() => {
    throw new ApiError(STATUS.BAD_REQUEST, 'The request body could not be read');
  });
  if (done) {
    return chunks;
  }
  if (size + value.byteLength > MAX_BODY_BYTES) {
    await reader.cancel();
    throw new ApiError(STATUS.PAYLOAD_TOO_LARGE, TOO_LARGE);
  }
  chunks.push(value);
  return collect(reader, chunks, size + value.byteLength);
}

/** The request body as text, within the cap (a declared length over it is refused unread). */
async function readCapped(request: Request): Promise<string> {
  const declared = Number(request.headers.get('content-length') ?? Number.NaN);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new ApiError(STATUS.PAYLOAD_TOO_LARGE, TOO_LARGE);
  }
  if (request.body === null) {
    return '';
  }
  const chunks = await collect(request.body.getReader(), [], 0);
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Parses a JSON request body into an object, refused as the SaaS server refuses it (probed against
 * server-framework, 2026-11-20): malformed JSON is `400` with the framework's string; JSON that
 * isn't an object is `422` with FastAPI's `dict_type` error; no body is FastAPI's `missing` 422; a
 * body over the cap is `413`.
 */
export async function readJsonObject(request: Request): Promise<object> {
  const text = await readCapped(request);
  if (text.trim() === '') {
    throw new ApiError(STATUS.UNPROCESSABLE, [
      { type: 'missing', loc: ['body'], msg: 'Field required', input: null, ctx: { error: 'Field required' } },
    ]);
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiError(STATUS.BAD_REQUEST, 'Invalid JSON syntax in request body');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ApiError(STATUS.UNPROCESSABLE, [
      { type: 'dict_type', loc: ['body'], msg: 'Input should be a valid dictionary', input: body },
    ]);
  }
  return body;
}

export function requiredString(body: object, key: string): string {
  const value: unknown = Reflect.get(body, key);
  if (typeof value !== 'string' || value === '') {
    throw validationError(`${key} is required`, key);
  }
  return value;
}

export function optionalString(body: object, key: string): string | undefined {
  const value: unknown = Reflect.get(body, key);
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw validationError(`${key} must be a string`, key);
  }
  return value;
}
