// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * A lite app is one person's app with no accounts, so every record belongs to one local owner.
 * It is run on the person's own machine or a network they trust.
 *
 * With no session to check, a cross-site write is refused here instead: a write must come
 * from this app's own pages. Browsers say where a request came from in `Sec-Fetch-Site`, and a
 * write must also say it is JSON, which no cross-site form can send without a preflight that
 * this API never grants. A route that takes a file's own bytes (an upload) names the media types it
 * reads instead; a cross-site form can't send those either.
 */
import type { NextRequest } from 'next/server.js';
import { ApiError } from './apiErrors';
import type { Owner } from './records';
import { STATUS } from './status';

/** The id every lite record's `created_by_user_id` carries. */
export const LOCAL_OWNER_ID = '00000000-0000-4000-8000-000000000001';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const SAME_SITE_FETCHES = new Set(['same-origin', 'none']);
const JSON_ONLY: readonly string[] = ['application/json'];

/**
 * The local owner, once the request has shown it comes from this app (an `OwnerResolver`).
 * `mediaTypes` are what a write's body may be: JSON unless the route reads others (an upload's
 * `['image/png', 'application/pdf', …]`).
 */
export function localOwner(request: NextRequest, mediaTypes: readonly string[] = JSON_ONLY): Owner {
  refuseCrossSiteWrite(request, mediaTypes);
  return { id: LOCAL_OWNER_ID };
}

/** A media type without its parameters, lower-cased: `application/json; charset=utf-8` → `application/json`. */
const essence = (type: string): string => (type.split(';')[0] ?? '').trim().toLowerCase();

/**
 * Throws unless a write comes from this app's own pages and its body is one of `mediaTypes` (JSON
 * by default): what a lite app checks in place of a session's CSRF token (`localOwner`, and
 * `accountsOwner` before its session).
 */
export function refuseCrossSiteWrite(request: NextRequest, mediaTypes: readonly string[] = JSON_ONLY): void {
  if (!SAFE_METHODS.has(request.method)) {
    const site = request.headers.get('sec-fetch-site');
    if (site !== null && !SAME_SITE_FETCHES.has(site)) {
      throw new ApiError(STATUS.FORBIDDEN, 'Cross-site requests are refused');
    }
    const type = request.headers.get('content-type') ?? '';
    // As the server: the media type is checked only when there is a body; none at all is a 422 later.
    const hasBody = request.body !== null && request.headers.get('content-length') !== '0';
    if (hasBody && !mediaTypes.includes(essence(type))) {
      // The framework's 415, naming what this route reads (the server's JSON routes also read others).
      throw new ApiError(STATUS.UNSUPPORTED_MEDIA_TYPE, 'Unsupported Media Type', { supported: [...mediaTypes] });
    }
  }
}
