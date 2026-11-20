// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * A lite app is one person's app with no accounts, so every record belongs to one local owner.
 * It is run on the person's own machine or a network they trust.
 *
 * With no session to check, a cross-site write is refused here instead: a write must come
 * from this app's own pages. Browsers say where a request came from in `Sec-Fetch-Site`, and a
 * write must also say it is JSON, which no cross-site form can send without a preflight that
 * this API never grants.
 */
import type { NextRequest } from 'next/server.js';
import { ApiError } from './apiErrors';
import type { Owner } from './records';
import { STATUS } from './status';

/** The id every lite record's `created_by_user_id` carries. */
export const LOCAL_OWNER_ID = '00000000-0000-4000-8000-000000000001';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const SAME_SITE_FETCHES = new Set(['same-origin', 'none']);

/** The local owner, once the request has shown it comes from this app (an `OwnerResolver`). */
export function localOwner(request: NextRequest): Owner {
  refuseCrossSiteWrite(request);
  return { id: LOCAL_OWNER_ID };
}

/**
 * Throws unless a write comes from this app's own pages and says it is JSON: what a lite app
 * checks in place of a session's CSRF token (`localOwner`, and `accountsOwner` before its session).
 */
export function refuseCrossSiteWrite(request: NextRequest): void {
  if (!SAFE_METHODS.has(request.method)) {
    const site = request.headers.get('sec-fetch-site');
    if (site !== null && !SAME_SITE_FETCHES.has(site)) {
      throw new ApiError(STATUS.FORBIDDEN, 'Cross-site requests are refused');
    }
    const type = request.headers.get('content-type') ?? '';
    // As the server: the media type is checked only when there is a body; none at all is a 422 later.
    const hasBody = request.body !== null && request.headers.get('content-length') !== '0';
    if (hasBody && !type.toLowerCase().startsWith('application/json')) {
      // The framework's 415, naming what this edition reads (the server also reads others).
      throw new ApiError(STATUS.UNSUPPORTED_MEDIA_TYPE, 'Unsupported Media Type', { supported: ['application/json'] });
    }
  }
}
