// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { STATUS } from './status';

describe('STATUS', () => {
  it('names the statuses server-framework answers with', () => {
    expect([
      STATUS.UNPROCESSABLE,
      STATUS.PRECONDITION_REQUIRED,
      STATUS.PRECONDITION_FAILED,
      STATUS.UNSUPPORTED_MEDIA_TYPE,
    ]).toEqual([422, 428, 412, 415]);
  });
});
