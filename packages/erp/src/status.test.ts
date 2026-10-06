// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { isDraft, isSubmitted, statusLabel } from './status';

describe('docstatus', () => {
  it('names each status, and nothing for a DocType without one', () => {
    expect([0, 1, 2, undefined].map(statusLabel)).toEqual(['Draft', 'Submitted', 'Cancelled', '']);
  });

  it('says whether a document may be submitted or cancelled', () => {
    expect([0, 1, 2].map(isDraft)).toEqual([true, false, false]);
    expect([0, 1, 2].map(isSubmitted)).toEqual([false, true, false]);
  });
});
