// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { csrfHeaders, SESSION_CREDENTIALS } from '@zephyrex/auth';
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

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`API ${status}: ${body.slice(0, ERROR_PREVIEW_CHARS)}`);
    this.name = 'ApiError';
  }
}

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

  /** Send a request; a bodiless answer (204) is `null`. */
  private async request(url: string, init: RequestInit & { method: string }): Promise<JsonValue> {
    const res = await fetchWithRetry(url, {
      ...init,
      credentials: SESSION_CREDENTIALS,
      headers: { 'Content-Type': 'application/json', ...csrfHeaders(init.method) },
    });
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

  async put(path: string, body?: JsonBody): Promise<JsonValue> {
    return this.request(this.url(path), this.withBody('PUT', body));
  }

  async patch(path: string, body?: JsonBody): Promise<JsonValue> {
    return this.request(this.url(path), this.withBody('PATCH', body));
  }

  async delete(path: string): Promise<JsonValue> {
    return this.request(this.url(path), { method: 'DELETE' });
  }
}
