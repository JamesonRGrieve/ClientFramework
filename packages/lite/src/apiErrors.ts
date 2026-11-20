// SPDX-License-Identifier: AGPL-3.0-or-later

import { NextResponse } from 'next/server.js';
import log, { ERRORS_ONLY } from 'zephyrex/log';
import { STATUS } from './status';

/**
 * An error's `detail`, in the shapes server-framework answers with (probed against the real server,
 * 2026-11-20): a plain string (authentication, `428 If-Match required`, malformed JSON, `415`), its
 * envelope `{ message, code?, errors? }` (records not found, conflicts, validation), FastAPI's list
 * of request-validation errors (a body that isn't an object), plus the structured 402 bodies.
 */
export type ErrorDetail =
  string | { message: string; code?: string; errors?: unknown[] } | Record<string, unknown> | Record<string, unknown>[];

/** An error whose status and `detail` are safe to show the client. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: ErrorDetail,
    /** Fields the framework puts beside `detail` (e.g. 415's `supported`). */
    readonly extra: Record<string, unknown> = {},
  ) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail));
    this.name = 'ApiError';
  }
}

/** A record-level refusal (404, 409, 403), in the framework's envelope. */
export function recordError(status: number, message: string): ApiError {
  return new ApiError(status, { message });
}

/** A request the framework's validation refuses: 422 with its envelope. */
export function validationError(message: string, field?: string): ApiError {
  return new ApiError(STATUS.UNPROCESSABLE, {
    message: 'Validation error',
    code: 'validation_error',
    errors: [{ loc: field === undefined ? [] : [field], msg: message }],
  });
}

/**
 * The default for an unexpected error: zephyrex's log, at the errors-only verbosity, so it shows
 * whenever LOG_VERBOSITY_SERVER is 1 or more (the framework's packages write to the console only
 * through it).
 */
export function logUnexpected(error: unknown): void {
  log([error], ERRORS_ONLY, 'unexpected error in a lite route');
}

/** Told of every unexpected error a route answers with the opaque 500 (see setErrorReporter). */
let reporter: ((error: unknown) => void) | undefined = logUnexpected;

/**
 * Names who is told of an unexpected error in place of zephyrex's log (logUnexpected, the
 * default): the app's own logger or error tracker. Pass `undefined` to stop reporting.
 */
export function setErrorReporter(report: ((error: unknown) => void) | undefined): void {
  reporter = report;
}

const INTERNAL_ERROR_BODY = { detail: { message: 'Internal Server Error', code: 'internal_error' } };

/**
 * The details server-framework itself answers as bare strings: authentication (401), the
 * precondition contract (428), malformed JSON on its Pydantic body routes (400) and an unsupported
 * media type (415).
 */
export const BARE_DETAILS: ReadonlySet<string> = new Set([
  'No authentication provided.',
  'If-Match required',
  'Invalid JSON syntax in request body',
  'Unsupported Media Type',
]);

/**
 * The `detail` server-framework answers: its envelope `{ message, ... }`, so no app can drift into
 * bare strings, except the framework's own bare strings (BARE_DETAILS).
 */
export function frameworkDetail(detail: ErrorDetail): ErrorDetail {
  return typeof detail === 'string' && !BARE_DETAILS.has(detail) ? { message: detail } : detail;
}

/**
 * Maps a thrown value to an API error response. An ApiError surfaces its status
 * and detail (in the framework's envelope); anything else is logged server-side and returned as
 * the opaque server-framework 500 body so internal details never leak.
 */
export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ detail: frameworkDetail(error.detail), ...error.extra }, { status: error.status });
  }
  reporter?.(error);
  return NextResponse.json(INTERNAL_ERROR_BODY, { status: STATUS.INTERNAL_SERVER_ERROR });
}
