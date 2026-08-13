// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { getCookie } from 'cookies-next';

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

export interface ZephyrexClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
}

export class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfter: number, body: string) {
    super(`Rate limited — retry after ${retryAfter}ms`);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfter;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body.slice(0, 200)}`);
    this.name = 'ApiError';
  }
}

function parseRetryAfter(res: Response): number {
  const header = res.headers.get('Retry-After');
  if (!header) return BASE_BACKOFF_MS;
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return BASE_BACKOFF_MS;
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(input, init);
    if (res.status !== 429) return res;

    lastResponse = res;
    if (attempt === retries) break;

    const retryAfter = parseRetryAfter(res);
    const jitter = Math.random() * 200;
    const delay = Math.min(retryAfter * Math.pow(2, attempt) + jitter, 30000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const body = await lastResponse!.text();
  throw new RateLimitError(parseRetryAfter(lastResponse!), body);
}

export class ZephyrexClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(config: ZephyrexClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken ?? (() => getCookie('jwt')?.toString() ?? null);
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const res = await fetchWithRetry(url, init);
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    return this.request<T>(url.toString(), { headers: this.headers() });
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.headers(),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: this.headers(),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  async delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
  }
}
