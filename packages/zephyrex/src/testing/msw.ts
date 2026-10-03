// SPDX-License-Identifier: AGPL-3.0-or-later
// Published as `zephyrex/testing/msw`, apart from `zephyrex/testing` so only tests that use mock
// servers need msw installed.
import { getResponse, HttpResponse, type RequestHandler } from 'msw';
import { etagOf, type Versioned } from '../lib/zephyrex/client';

const PRECONDITION_FAILED = 412;
const PRECONDITION_REQUIRED = 428;

const MICROS_PER_MILLI = 1000;
/** The microseconds' digits after the milliseconds' three. */
const MICRO_DIGITS = 3;
let lastStamp = 0;

/**
 * A row version as the server stamps one: UTC to the microsecond, with no zone suffix. Each stamp
 * is later than the one before, so two writes in the same millisecond are still told apart.
 */
export function versionStamp(): string {
  lastStamp = Math.max(Date.now() * MICROS_PER_MILLI, lastStamp + 1);
  const millis = Math.floor(lastStamp / MICROS_PER_MILLI);
  const micros = String(lastStamp % MICROS_PER_MILLI).padStart(MICRO_DIGITS, '0');
  return `${new Date(millis).toISOString().slice(0, -1)}${micros}`;
}

/**
 * The server's guard on a change to `row`: 428 when the request names no version, 412 with the row
 * as it is now when the request's If-Match is an older version, else null to go ahead.
 */
export function refuseStale(request: Request, row: Versioned): Response | null {
  const ifMatch = request.headers.get('If-Match');
  if (ifMatch === null) {
    return HttpResponse.json({ detail: 'If-Match required' }, { status: PRECONDITION_REQUIRED });
  }
  return ifMatch === etagOf(row)
    ? null
    : HttpResponse.json(
        { detail: 'This record changed since you loaded it.', current: row },
        { status: PRECONDITION_FAILED },
      );
}

/**
 * A `fetch` answered by msw `handlers`, for stubbing in unit tests with the same mock server the
 * stories use. A request no handler answers gets an empty JSON object, like the app shell's reads.
 */
export function fetchFrom(handlers: RequestHandler[]): typeof fetch {
  return async (input, init) => {
    const request = new Request(input instanceof Request ? input : String(input), init);
    return (await getResponse(handlers, request)) ?? HttpResponse.json({});
  };
}
