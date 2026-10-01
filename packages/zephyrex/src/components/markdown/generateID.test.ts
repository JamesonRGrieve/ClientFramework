// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import generateId from './generateID';

describe('generateId', () => {
  it('lowercases and slugifies whitespace between words', () => {
    expect(generateId('Hello World')).toBe('hello-world');
  });

  it('collapses runs of non-word characters into a single dash', () => {
    expect(generateId('Foo -- Bar!!  Baz')).toBe('foo-bar-baz');
  });

  it('preserves underscores and digits (word characters)', () => {
    expect(generateId('Section_2 Heading')).toBe('section_2-heading');
  });

  it('returns an empty string for empty input', () => {
    expect(generateId('')).toBe('');
  });
});
