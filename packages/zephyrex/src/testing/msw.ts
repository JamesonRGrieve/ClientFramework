// SPDX-License-Identifier: AGPL-3.0-or-later
// Published as `zephyrex/testing/msw`, apart from `zephyrex/testing` so only tests that use mock
// servers need msw installed.
import { getResponse, http, HttpResponse, type RequestHandler } from 'msw';
import { z } from 'zod';
import { etagOf, type Versioned } from '../lib/zephyrex/client';

const CREATED = 201;
const NO_CONTENT = 204;
const NOT_FOUND = 404;
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

/** The server's answer for a row that doesn't exist or isn't the requester's to see. */
export const notFound = (): Response => HttpResponse.json({ detail: 'Not found' }, { status: NOT_FOUND });

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

/** A request a recording `fetch` answered. */
export interface Call {
  url: string;
  init: RequestInit | undefined;
}

/** A `fetchFrom(handlers)` that records each request into `calls`, for tests that check what was sent. */
export function recordingFetch(handlers: RequestHandler[]): { fetch: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  const answer = fetchFrom(handlers);
  return {
    calls,
    fetch: async (input, init): Promise<Response> => {
      calls.push({ url: input instanceof Request ? input.url : input.toString(), init });
      return answer(input, init);
    },
  };
}

/** A write as sent: its method, path, body and If-Match. */
export type Write = [string | undefined, string, BodyInit | null | undefined, string | null];

/** The writes among `calls`, in the order sent. */
export const writesOf = (calls: readonly Call[]): Write[] =>
  calls
    .filter(({ init }) => (init?.method ?? 'GET') !== 'GET')
    .map(({ url, init }) => [init?.method, new URL(url).pathname, init?.body, new Headers(init?.headers).get('If-Match')]);

/** The row `id` of `rows`; a test or story naming one that isn't there is a mistake in it. */
export function rowOf<T extends { id: string }>(rows: readonly T[], id: string): T {
  const found = rows.find((row) => row.id === id);
  if (found === undefined) {
    throw new Error(`No row ${id} in the fixture`);
  }
  return found;
}

/** A row of a mock table: an id and the server's version stamps. */
type TableRow = Versioned & { id: string };

/** One resource of a mock store: how to read and replace its rows, what a row is, and where it is served. */
export interface RestTable<T extends TableRow> {
  rows: () => T[];
  set: (rows: T[]) => void;
  schema: z.ZodType<T>;
  endpoint: string;
  /** The envelope a row is sent and answered in (`{ agent: {...} }`), and a list's (`{ agents: [...] }`). */
  single: string;
  plural: string;
  /** The fields a list may be filtered by, as query parameters (agent_id, project_id, ...). */
  filters: readonly (keyof T & string)[];
  /** What the server sets on a new row that its creator doesn't send. */
  defaults?: Partial<T>;
}

const JsonSchema = z.json();

/**
 * A table's REST routes as the server serves them: list (filtered by its fields), get, create (ids
 * `<single>-<n>`, stamped as made now), change and delete, each change held to the row's version.
 */
export function restTable<T extends TableRow>(table: RestTable<T>): RequestHandler[] {
  let created = 0;
  const BodySchema = z.object({ [table.single]: z.record(z.string(), JsonSchema) });
  const fieldsOf = async (request: Request): Promise<Record<string, z.infer<typeof JsonSchema>>> =>
    BodySchema.parse(await request.json())[table.single] ?? {};
  const rowWithId = (id: string | readonly string[] | undefined): T | undefined => table.rows().find((row) => row.id === id);
  return [
    http.get(`*${table.endpoint}`, ({ request }) => {
      const query = new URL(request.url).searchParams;
      return HttpResponse.json({
        [table.plural]: table
          .rows()
          .filter((row) => table.filters.every((field) => !query.has(field) || String(row[field]) === query.get(field))),
      });
    }),
    http.get(`*${table.endpoint}/:id`, ({ params: { id } }) => {
      const found = rowWithId(id);
      return found === undefined ? notFound() : HttpResponse.json({ [table.single]: found });
    }),
    http.post(`*${table.endpoint}`, async ({ request }) => {
      created += 1;
      const row = table.schema.parse({
        ...table.defaults,
        ...(await fieldsOf(request)),
        id: `${table.single}-${String(created)}`,
        created_at: versionStamp(),
        updated_at: null,
      });
      table.set([...table.rows(), row]);
      return HttpResponse.json({ [table.single]: row }, { status: CREATED });
    }),
    http.put(`*${table.endpoint}/:id`, async ({ params: { id }, request }) => {
      const current = rowWithId(id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      const updated = table.schema.parse({ ...current, ...(await fieldsOf(request)), updated_at: versionStamp() });
      table.set(table.rows().map((row) => (row.id === current.id ? updated : row)));
      return HttpResponse.json({ [table.single]: updated });
    }),
    http.delete(`*${table.endpoint}/:id`, ({ params: { id }, request }) => {
      const current = rowWithId(id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      table.set(table.rows().filter((row) => row.id !== current.id));
      return new HttpResponse(null, { status: NO_CONTENT });
    }),
  ];
}
