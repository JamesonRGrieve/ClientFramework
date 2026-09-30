// SPDX-License-Identifier: AGPL-3.0-or-later
/** The HTTP statuses the client acts on, by name. */
export const HTTP_STATUS = {
  OK: 200,
  MULTIPLE_CHOICES: 300,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/** Whether a status is a success (2xx). */
export const isSuccessStatus = (status: number): boolean =>
  status >= HTTP_STATUS.OK && status < HTTP_STATUS.MULTIPLE_CHOICES;

/** Whether a status is a server failure (5xx). */
export const isServerErrorStatus = (status: number): boolean => status >= HTTP_STATUS.INTERNAL_SERVER_ERROR;
