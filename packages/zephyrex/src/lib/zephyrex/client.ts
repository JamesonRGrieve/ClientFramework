// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { csrfHeaders, etagOf, SESSION_CREDENTIALS, type Versioned } from '@zephyrex/auth';
import { z } from 'zod';

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const MAX_JITTER_MS = 200;
const MS_PER_SECOND = 1000;
const TOO_MANY_REQUESTS = 429;
const NO_CONTENT = 204;
const ERROR_PREVIEW_CHARS = 200;

const JsonSchema = z.json();
/** A decoded JSON body. Callers validate it against their own schema. */
export type JsonValue = z.infer<typeof JsonSchema>;
/** A request body: JSON, where an `undefined` field is simply left out. */
export type JsonBody =
  string | number | boolean | null | readonly JsonBody[] | { readonly [key: string]: JsonBody | undefined };

export interface ZephyrexClientConfig {
  /** The API base: '' or '/api' when the app proxies the API on its own origin, else absolute. */
  baseUrl: string;
}

/** The server kept answering 429; `retryAfterMs` is its last Retry-After. */
export class RateLimitError extends Error {
  constructor(
    readonly retryAfterMs: number,
    readonly body: string,
  ) {
    super(`Rate limited — retry after ${retryAfterMs}ms`);
    this.name = 'RateLimitError';
  }
}

/** The server's error body: a message, or a message with the rules a refused value broke. */
const ErrorBodySchema = z.object({
  detail: z.union([z.string(), z.object({ message: z.string(), failed: z.array(z.string()).optional() })]),
});

/**
 * `body`'s `detail` and `failed`, when it is the server's error shape; else the start of the body
 * itself, or the status when there is none.
 */
function errorDetail(status: number, body: string): { detail: string; failed: string[] } {
  try {
    const parsed = ErrorBodySchema.safeParse(JSON.parse(body));
    if (parsed.success) {
      const { detail } = parsed.data;
      return typeof detail === 'string' ? { detail, failed: [] } : { detail: detail.message, failed: detail.failed ?? [] };
    }
  } catch {
    // Not JSON: the body is the message.
  }
  return { detail: body === '' ? `HTTP ${status}` : body.slice(0, ERROR_PREVIEW_CHARS), failed: [] };
}

/**
 * A non-2xx answer. Its message is the server's `detail`, fit to show the user; `failed` names the
 * rules a refused value broke (e.g. the password policy's), when the server listed them.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: string;
  readonly detail: string;
  readonly failed: readonly string[];

  constructor(status: number, body: string) {
    const { detail, failed } = errorDetail(status, body);
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.detail = detail;
    this.failed = failed;
  }
}

const PRECONDITION_FAILED = 412;

const StaleBodySchema = z.object({ current: JsonSchema.optional() });

/**
 * The row changed on the server since the caller read it (412), so the write was refused.
 * `current` is the row as it is now, when the server sent it; null when it didn't, so the caller
 * refetches (and a 404 then means the row is gone).
 */
export class StaleWriteError extends ApiError {
  readonly current: JsonValue | null;

  constructor(body: string) {
    super(PRECONDITION_FAILED, body);
    this.name = 'StaleWriteError';
    let current: JsonValue | null = null;
    try {
      current = StaleBodySchema.parse(JSON.parse(body)).current ?? null;
    } catch {
      // No usable body: the caller refetches.
    }
    this.current = current;
  }
}

// A row's version and its If-Match value come from @zephyrex/auth, so both clients guard alike.
export { etagOf, type Versioned };

/** How many rows `list` asks for per page. */
export const LIST_PAGE_SIZE = 100;

const ListPageSchema = z.looseObject({ pagination: z.object({ has_more: z.boolean() }).optional() });

/** Retry-After as milliseconds: delta-seconds or an HTTP date, else the base backoff. */
export function parseRetryAfter(res: Response): number {
  const header = res.headers.get('Retry-After');
  if (header === null || header === '') {
    return BASE_BACKOFF_MS;
  }
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) {
    return seconds * MS_PER_SECOND;
  }
  const date = Date.parse(header);
  return Number.isNaN(date) ? BASE_BACKOFF_MS : Math.max(0, date - Date.now());
}

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Fetch, retrying a 429 after Retry-After with exponential backoff; gives up with RateLimitError. */
async function fetchWithRetry(input: string, init: RequestInit, attempt = 0): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== TOO_MANY_REQUESTS) {
    return res;
  }
  const retryAfter = parseRetryAfter(res);
  if (attempt >= MAX_RETRIES) {
    throw new RateLimitError(retryAfter, await res.text());
  }
  await sleep(Math.min(retryAfter * 2 ** attempt + Math.random() * MAX_JITTER_MS, MAX_BACKOFF_MS));
  return fetchWithRetry(input, init, attempt + 1);
}

/**
 * Calls the Zephyrex API as the signed-in user. The session is the server's HttpOnly cookie, sent
 * because the API is on the app's own origin (`baseUrl` '' or '/api' behind the app's proxy); writes
 * carry the CSRF token. No token is ever read or sent by script.
 */
export class ZephyrexClient {
  private readonly baseUrl: string;

  constructor(config: ZephyrexClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
  }

  /** Send a request, guarded by `seen`'s version when given; a bodiless answer (204) is `null`. */
  private async request(url: string, init: RequestInit & { method: string }, seen?: Versioned): Promise<JsonValue> {
    const res = await fetchWithRetry(url, {
      ...init,
      credentials: SESSION_CREDENTIALS,
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeaders(init.method),
        ...(seen === undefined ? {} : { 'If-Match': etagOf(seen) }),
      },
    });
    if (res.status === PRECONDITION_FAILED) {
      throw new StaleWriteError(await res.text());
    }
    if (!res.ok) {
      throw new ApiError(res.status, await res.text());
    }
    if (res.status === NO_CONTENT) {
      return null;
    }
    return JsonSchema.parse(await res.json());
  }

  private withBody(method: string, body: JsonBody | undefined): RequestInit & { method: string } {
    return { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) };
  }

  /**
   * Where `path` is on the API, with `params` as its query. Also the address for a plain link, such
   * as a download, which the browser sends with the session cookie like any request here.
   */
  url(path: string, params?: Record<string, string>): string {
    const query = new URLSearchParams(params).toString();
    return `${this.baseUrl}${path}${query === '' ? '' : `?${query}`}`;
  }

  async get(path: string, params?: Record<string, string>): Promise<JsonValue> {
    return this.request(this.url(path, params), { method: 'GET' });
  }

  async post(path: string, body?: JsonBody): Promise<JsonValue> {
    return this.request(this.url(path), this.withBody('POST', body));
  }

  // Every change to an existing row names the row as the caller last read it (`seen`), and is sent
  // only if the server's row is still that version: else StaleWriteError, never a silent overwrite.

  async put(path: string, body: JsonBody, seen: Versioned): Promise<JsonValue> {
    return this.request(this.url(path), this.withBody('PUT', body), seen);
  }

  async patch(path: string, body: JsonBody, seen: Versioned): Promise<JsonValue> {
    return this.request(this.url(path), this.withBody('PATCH', body), seen);
  }

  async delete(path: string, seen: Versioned): Promise<JsonValue> {
    return this.request(this.url(path), { method: 'DELETE' }, seen);
  }

  /**
   * Every row of a paginated list route (`{ <key>: [...], pagination: { has_more } }`), walking
   * `offset`/`limit` pages until the server says there are no more. Each page decides whether there
   * is a next, so they are fetched one after another. `params` is the rest of each page's query.
   */
  async list<T>(path: string, key: string, itemSchema: z.ZodType<T>, params: Record<string, string> = {}): Promise<T[]> {
    const fromOffset = async (offset: number): Promise<T[]> => {
      const query = { ...params, offset: String(offset), limit: String(LIST_PAGE_SIZE) };
      const page = ListPageSchema.parse(await this.get(path, query));
      const items = z.array(itemSchema).parse(new Map(Object.entries(page)).get(key));
      if (page.pagination?.has_more !== true || items.length === 0) {
        return items;
      }
      return [...items, ...(await fromOffset(offset + LIST_PAGE_SIZE))];
    };
    return fromOffset(0);
  }
}
