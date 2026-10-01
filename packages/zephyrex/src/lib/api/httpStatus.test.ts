// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { isServerErrorStatus, isSuccessStatus } from './httpStatus';

describe('isSuccessStatus', () => {
  it.each([
    [200, true],
    [204, true],
    [299, true],
    [199, false],
    [300, false],
    [404, false],
  ])('%i → %s', (status, expected) => {
    expect(isSuccessStatus(status)).toBe(expected);
  });
});

describe('isServerErrorStatus', () => {
  it.each([
    [500, true],
    [503, true],
    [499, false],
    [200, false],
  ])('%i → %s', (status, expected) => {
    expect(isServerErrorStatus(status)).toBe(expected);
  });
});
