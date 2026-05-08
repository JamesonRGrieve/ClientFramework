import { ApiError, parseErrorResponse } from './errors';
import { extractCorrelationId, mintTraceparent, parseDeprecation, parseRateLimit } from './headers';
import type {
  ApiResponse,
  DeprecationInfo,
  HttpMethod,
  Page,
  RateLimitInfo,
  SearchRequest,
} from './types';

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
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
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
 * Auth is pluggable: pass `authHeader` to inject a JWT/API key. Core never
 * imports the auth submodule directly — keeps the client decoupled.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly authHeader?: AuthHeaderProvider;
  private readonly onDeprecation?: DeprecationListener;
  private readonly onRateLimit?: RateLimitListener;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    const envUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URI : undefined;
    this.baseUrl = (options.baseUrl ?? envUrl ?? '').replace(/\/+$/, '');
    this.authHeader = options.authHeader;
    this.onDeprecation = options.onDeprecation;
    this.onRateLimit = options.onRateLimit;
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}${buildQuery(options.query)}`;
    const headers = new Headers(options.headers);
    if (!headers.has('accept')) headers.set('accept', 'application/json');
    if (body !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    if (!headers.has('traceparent')) headers.set('traceparent', mintTraceparent());

    if (this.authHeader) {
      const auth = await this.authHeader();
      if (auth && !headers.has('authorization')) headers.set('authorization', auth);
    }

    const response = await this.fetchImpl(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
      credentials: 'include',
    });

    const correlationId = extractCorrelationId(response.headers);
    const deprecation = parseDeprecation(response.headers, path);
    if (deprecation && this.onDeprecation) this.onDeprecation(deprecation);

    const rateLimit = parseRateLimit(response.headers);
    if (rateLimit && this.onRateLimit) this.onRateLimit(rateLimit);

    if (!response.ok) {
      throw await parseErrorResponse(response, correlationId);
    }

    const data = await this.decodeBody<T>(response);
    return { data, status: response.status, headers: response.headers, correlationId, deprecation };
  }

  private async decodeBody<T>(response: Response): Promise<T> {
    if (response.status === NO_CONTENT) return undefined as T;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    const text = await response.text();
    return (text || (undefined as unknown)) as T;
  }

  get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T = void>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  list<T>(resource: string, options?: RequestOptions): Promise<ApiResponse<Page<T>>> {
    return this.get<Page<T>>(`/v1/${resource}`, options);
  }

  search<T>(resource: string, query: SearchRequest): Promise<ApiResponse<Page<T>>> {
    return this.post<Page<T>>(`/v1/${resource}/search`, query);
  }

  read<T>(resource: string, id: string): Promise<ApiResponse<T>> {
    return this.get<T>(`/v1/${resource}/${encodeURIComponent(id)}`);
  }

  create<T>(resource: string, body: unknown): Promise<ApiResponse<T>> {
    return this.post<T>(`/v1/${resource}`, body);
  }

  update<T>(resource: string, id: string, body: unknown): Promise<ApiResponse<T>> {
    return this.put<T>(`/v1/${resource}/${encodeURIComponent(id)}`, body);
  }

  remove<T = void>(resource: string, id: string): Promise<ApiResponse<T>> {
    return this.delete<T>(`/v1/${resource}/${encodeURIComponent(id)}`);
  }

  batchUpdate<T>(resource: string, body: unknown): Promise<ApiResponse<T>> {
    return this.put<T>(`/v1/${resource}`, body);
  }

  batchDelete<T = void>(resource: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', `/v1/${resource}`, body);
  }
}

let singleton: ApiClient | undefined;

export function getApiClient(): ApiClient {
  if (!singleton) singleton = new ApiClient();
  return singleton;
}

export function configureApiClient(options: ApiClientOptions): ApiClient {
  singleton = new ApiClient(options);
  return singleton;
}

export const ACCEPTED = STATUS_ACCEPTED;
export const OK = STATUS_OK;
