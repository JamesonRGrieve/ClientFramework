import type { ApiEnvelopeError } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly detail: ApiEnvelopeError['detail'];
  readonly correlationId?: string;
  readonly retryAfter?: number;

  constructor(opts: {
    status: number;
    detail: ApiEnvelopeError['detail'];
    code?: string;
    correlationId?: string;
    retryAfter?: number;
  }) {
    const message = typeof opts.detail === 'string' ? opts.detail : (opts.code ?? `HTTP ${opts.status}`);
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.detail = opts.detail;
    this.code = opts.code;
    this.correlationId = opts.correlationId;
    this.retryAfter = opts.retryAfter;
  }

  isRateLimited(): boolean {
    return this.status === 429;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

export async function parseErrorResponse(response: Response, correlationId?: string): Promise<ApiError> {
  let detail: ApiEnvelopeError['detail'] = response.statusText;
  let code: string | undefined;
  try {
    const body = (await response.clone().json()) as ApiEnvelopeError;
    if (body && typeof body === 'object') {
      detail = body.detail ?? response.statusText;
      code = body.code;
    }
  } catch {
    try {
      const text = await response.clone().text();
      if (text) detail = text;
    } catch {
      // swallow — body may have been consumed
    }
  }
  const retryAfterRaw = response.headers.get('retry-after');
  const retryAfter = retryAfterRaw ? Number.parseInt(retryAfterRaw, 10) : undefined;
  return new ApiError({
    status: response.status,
    detail,
    code,
    correlationId,
    retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
  });
}
