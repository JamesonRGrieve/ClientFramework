// SPDX-License-Identifier: AGPL-3.0-or-later
import { csrfHeaders, SESSION_CREDENTIALS } from '@zephyrex/auth';
import { parseErrorResponse } from './errors';
import { extractCorrelationId, mintTraceparent, parseDeprecation, parseRateLimit } from './headers';
import type { ApiResponse, DeprecationInfo, HttpMethod, Page, RateLimitInfo, SearchRequest } from './types';

const NO_CONTENT = 204;
const STATUS_OK = 200;
const STATUS_ACCEPTED = 202;

export type AuthHeaderProvider = () => string | undefined | Promise<string | undefined>;
export type DeprecationListener = (info: DeprecationInfo) => void;
export type RateLimitListener = (info: RateLimitInfo) => void;

export interface ApiClientOptions {
  baseUrl?: string;
  authHeader?: AuthHeaderProvider;
  onDeprecation?: DeprecationListener;
  onRateLimit?: RateLimitListener;
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
}

const buildQuery = (query?: RequestOptions['query']): string => {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
};

/**
 * Typed REST client for the ServerFramework base install. Cross-cutting:
 *   - mints W3C traceparent for correlation
 *   - surfaces Deprecation/Sunset headers via onDeprecation
 *   - surfaces 429 + Retry-After via onRateLimit and ApiError.retryAfter
 *   - decodes FastAPI-style {detail, code} error envelopes
 *
 * In the browser it rides the server's HttpOnly session cookie on the app's own origin (`baseUrl`
 * '' or '/api'), sending the CSRF token on writes. Outside a browser, pass `authHeader` to send an
 * API key instead.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly authHeader?: AuthHeaderProvider;
  private readonly onDeprecation?: DeprecationListener;
  private readonly onRateLimit?: RateLimitListener;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? '').replace(/\/+$/, '');
    this.authHeader = options.authHeader;
    this.onDeprecation = options.onDeprecation;
    this.onRateLimit = options.onRateLimit;
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  }

  async request<T>(method: HttpMethod, path: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}${buildQuery(options.query)}`;
    const headers = new Headers(options.headers);
    if (!headers.has('accept')) {
      headers.set('accept', 'application/json');
    }
    if (body !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    if (!headers.has('traceparent')) {
      headers.set('traceparent', mintTraceparent());
    }
    for (const [name, value] of Object.entries(csrfHeaders(method))) {
      headers.set(name, value);
    }

    if (this.authHeader) {
      const auth = await this.authHeader();
      if (auth && !headers.has('authorization')) {
        headers.set('authorization', auth);
      }
    }

    const response = await this.fetchImpl(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
      credentials: SESSION_CREDENTIALS,
    });

    const correlationId = extractCorrelationId(response.headers);
    const deprecation = parseDeprecation(response.headers, path);
    if (deprecation && this.onDeprecation) {
      this.onDeprecation(deprecation);
    }

    const rateLimit = parseRateLimit(response.headers);
    if (rateLimit && this.onRateLimit) {
      this.onRateLimit(rateLimit);
    }

    if (!response.ok) {
      throw await parseErrorResponse(response, correlationId);
    }

    const data = await this.decodeBody<T>(response);
    return { data, status: response.status, headers: response.headers, correlationId, deprecation };
  }

  private async decodeBody<T>(response: Response): Promise<T> {
    if (response.status === NO_CONTENT) {
      return undefined as T;
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    const text = await response.text();
    return (text || (undefined as unknown)) as T;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, options);
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, options);
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, options);
  }

  async delete<T = void>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  async list<T>(resource: string, options?: RequestOptions): Promise<ApiResponse<Page<T>>> {
    return this.get<Page<T>>(`/v1/${resource}`, options);
  }

  async search<T>(resource: string, query: SearchRequest): Promise<ApiResponse<Page<T>>> {
    return this.post<Page<T>>(`/v1/${resource}/search`, query);
  }

  async read<T>(resource: string, id: string): Promise<ApiResponse<T>> {
    return this.get<T>(`/v1/${resource}/${encodeURIComponent(id)}`);
  }

  async create<T>(resource: string, body: unknown): Promise<ApiResponse<T>> {
    return this.post<T>(`/v1/${resource}`, body);
  }

  async update<T>(resource: string, id: string, body: unknown): Promise<ApiResponse<T>> {
    return this.put<T>(`/v1/${resource}/${encodeURIComponent(id)}`, body);
  }

  async remove<T = void>(resource: string, id: string): Promise<ApiResponse<T>> {
    return this.delete<T>(`/v1/${resource}/${encodeURIComponent(id)}`);
  }

  async batchUpdate<T>(resource: string, body: unknown): Promise<ApiResponse<T>> {
    return this.put<T>(`/v1/${resource}`, body);
  }

  async batchDelete<T = void>(resource: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', `/v1/${resource}`, body);
  }
}

let singleton: ApiClient | undefined;
let configured: ApiClientOptions = {};

export function getApiClient(): ApiClient {
  singleton ??= new ApiClient(configured);
  return singleton;
}

/** Set options on the shared client, keeping any set before (the app's base URL, a listener). */
export function configureApiClient(options: ApiClientOptions): ApiClient {
  configured = { ...configured, ...options };
  singleton = new ApiClient(configured);
  return singleton;
}

export const ACCEPTED = STATUS_ACCEPTED;
export const OK = STATUS_OK;
