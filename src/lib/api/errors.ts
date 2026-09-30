// SPDX-License-Identifier: AGPL-3.0-or-later
import { z } from 'zod';
import { HTTP_STATUS, isServerErrorStatus } from './httpStatus';
import type { ApiEnvelopeError } from './types';

const DECIMAL_RADIX = 10;

/** The error envelope, as far as the server sent one. */
const ErrorBodySchema = z.object({
  detail: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  code: z.string().optional(),
});

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
    return this.status === HTTP_STATUS.TOO_MANY_REQUESTS;
  }

  isUnauthorized(): boolean {
    return this.status === HTTP_STATUS.UNAUTHORIZED;
  }

  isForbidden(): boolean {
    return this.status === HTTP_STATUS.FORBIDDEN;
  }

  isNotFound(): boolean {
    return this.status === HTTP_STATUS.NOT_FOUND;
  }

  isServerError(): boolean {
    return isServerErrorStatus(this.status);
  }
}

export async function parseErrorResponse(response: Response, correlationId?: string): Promise<ApiError> {
  let detail: ApiEnvelopeError['detail'] = response.statusText;
  let code: string | undefined;
  try {
    const body = ErrorBodySchema.safeParse(await response.clone().json());
    if (body.success) {
      detail = body.data.detail ?? response.statusText;
      code = body.data.code;
    }
  } catch {
    try {
      const text = await response.clone().text();
      if (text !== '') {
        detail = text;
      }
    } catch {
      // swallow — body may have been consumed
    }
  }
  const retryAfterRaw = response.headers.get('retry-after');
  const retryAfter =
    retryAfterRaw !== null && retryAfterRaw !== '' ? Number.parseInt(retryAfterRaw, DECIMAL_RADIX) : undefined;
  return new ApiError({
    status: response.status,
    detail,
    code,
    correlationId,
    retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
  });
}
