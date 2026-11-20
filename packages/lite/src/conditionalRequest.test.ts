// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { entityTag, evaluateIfMatch, nextUpdateStamp } from './conditionalRequest';

const VALIDATOR = '2026-10-02T21:29:39.141Z';

describe('nextUpdateStamp', () => {
  const previous = new Date(VALIDATOR);

  it('stamps the current time when it is after the previous stamp', () => {
    const now = new Date(previous.getTime() + 5000);
    expect(nextUpdateStamp(previous, now)).toEqual(now);
  });

  it('steps one millisecond past a previous stamp in the same tick', () => {
    expect(nextUpdateStamp(previous, previous).getTime()).toBe(previous.getTime() + 1);
  });

  it('never goes backwards when the clock is behind the previous stamp', () => {
    const behind = new Date(previous.getTime() - 60_000);
    expect(nextUpdateStamp(previous, behind).getTime()).toBe(previous.getTime() + 1);
  });
});

describe('entityTag', () => {
  it('quotes the validator verbatim, strong and unhashed', () => {
    expect(entityTag(VALIDATOR)).toBe(`"${VALIDATOR}"`);
  });
});

describe('evaluateIfMatch', () => {
  it('reports a missing or blank header as absent', () => {
    expect(evaluateIfMatch(null, VALIDATOR)).toBe('absent');
    expect(evaluateIfMatch('  ', VALIDATOR)).toBe('absent');
  });

  it('matches the current tag byte for byte', () => {
    expect(evaluateIfMatch(entityTag(VALIDATOR), VALIDATOR)).toBe('match');
  });

  it('refuses a stale tag', () => {
    expect(evaluateIfMatch('"2026-10-02T21:29:38.000Z"', VALIDATOR)).toBe('mismatch');
  });

  it('never reformats: a differently written same instant is a mismatch', () => {
    expect(evaluateIfMatch('"2026-10-02T21:29:39.141000"', VALIDATOR)).toBe('mismatch');
  });

  it('matches any current representation for *', () => {
    expect(evaluateIfMatch(' * ', VALIDATOR)).toBe('match');
  });

  it('matches when any tag in a list is current', () => {
    expect(evaluateIfMatch(`"stale", ${entityTag(VALIDATOR)}`, VALIDATOR)).toBe('match');
  });

  // server-framework parity (zephyrex.lib.Preconditions.IfMatch): the version is opaque.
  it('ignores the W/ prefix a compressing proxy may add', () => {
    expect(evaluateIfMatch(`W/${entityTag(VALIDATOR)}`, VALIDATOR)).toBe('match');
    expect(evaluateIfMatch('W/"stale"', VALIDATOR)).toBe('mismatch');
  });

  it('accepts a bare version copied from a row, and reads the tags out of a messy header', () => {
    expect(evaluateIfMatch(VALIDATOR, VALIDATOR)).toBe('match');
    expect(evaluateIfMatch(`${entityTag(VALIDATOR)} junk`, VALIDATOR)).toBe('match');
    expect(evaluateIfMatch('junk', VALIDATOR)).toBe('mismatch');
  });
});
