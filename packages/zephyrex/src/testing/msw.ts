// SPDX-License-Identifier: AGPL-3.0-or-later
// Published as `zephyrex/testing/msw`, apart from `zephyrex/testing` so only tests that use mock
// servers need msw installed.
import { getResponse, HttpResponse, type RequestHandler } from 'msw';

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
