// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { getCookie } from 'cookies-next';
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
  baseUrl: string;
  getToken?: () => string | null;
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

const defaultToken = (): string | null => {
  const jwt = getCookie('jwt');
  return typeof jwt === 'string' && jwt !== '' ? jwt : null;
};

export class ZephyrexClient {
  private readonly baseUrl: string;
  private readonly getToken: () => string | null;

  constructor(config: ZephyrexClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken ?? defaultToken;
  }

  private headers(): Record<string, string> {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token === null || token === '' ? {} : { Authorization: `Bearer ${token}` }),
    };
  }

  /** Send a request; a bodiless answer (204) is `null`. */
  private async request(url: string, init: RequestInit): Promise<JsonValue> {
    const res = await fetchWithRetry(url, { ...init, headers: this.headers() });
    if (!res.ok) {
      throw new ApiError(res.status, await res.text());
    }
    if (res.status === NO_CONTENT) {
      return null;
    }
    return JsonSchema.parse(await res.json());
  }

  private withBody(method: string, body: JsonBody | undefined): RequestInit {
    return { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) };
  }

  async get(path: string, params?: Record<string, string>): Promise<JsonValue> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      url.searchParams.set(key, value);
    }
    return this.request(url.toString(), { method: 'GET' });
  }

  async post(path: string, body?: JsonBody): Promise<JsonValue> {
    return this.request(`${this.baseUrl}${path}`, this.withBody('POST', body));
  }

  async put(path: string, body?: JsonBody): Promise<JsonValue> {
    return this.request(`${this.baseUrl}${path}`, this.withBody('PUT', body));
  }

  async patch(path: string, body?: JsonBody): Promise<JsonValue> {
    return this.request(`${this.baseUrl}${path}`, this.withBody('PATCH', body));
  }

  async delete(path: string): Promise<JsonValue> {
    return this.request(`${this.baseUrl}${path}`, { method: 'DELETE' });
  }
}
