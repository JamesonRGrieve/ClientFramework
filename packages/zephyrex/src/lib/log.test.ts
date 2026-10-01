// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import log, { passesVerbosity } from './log';

describe('passesVerbosity', () => {
  it('passes a level at or below the configured verbosity', () => {
    expect(passesVerbosity(1, '3')).toBe(true);
    expect(passesVerbosity(3, '3')).toBe(true);
    expect(passesVerbosity(4, '3')).toBe(false);
  });

  it('passes nothing when the verbosity is unset, blank or not a number, or the message has no level', () => {
    expect(passesVerbosity(1, undefined)).toBe(false);
    expect(passesVerbosity(1, '')).toBe(false);
    expect(passesVerbosity(1, ' ')).toBe(false);
    expect(passesVerbosity(1, 'loud')).toBe(false);
    expect(passesVerbosity(undefined, '3')).toBe(false);
  });

  it('silences everything at 0', () => {
    expect(passesVerbosity(1, '0')).toBe(false);
  });
});

describe('log (in the browser)', () => {
  const setting = process.env.NEXT_PUBLIC_LOG_VERBOSITY_CLIENT;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    process.env.NEXT_PUBLIC_LOG_VERBOSITY_CLIENT = '2';
  });

  afterEach(() => {
    consoleLog.mockRestore();
    if (setting === undefined) {
      delete process.env.NEXT_PUBLIC_LOG_VERBOSITY_CLIENT;
    } else {
      process.env.NEXT_PUBLIC_LOG_VERBOSITY_CLIENT = setting;
    }
  });

  it('logs a message whose client level passes, and skips one that does not', () => {
    log(['shown'], { client: 2 });
    log(['hidden'], { client: 3 });
    log(['server only'], { server: 1 });
    expect(consoleLog.mock.calls).toEqual([['shown']]);
  });

  it('frames a heading with a rule as wide as it', () => {
    log(['body'], { client: 1 }, 'setup');
    expect(consoleLog.mock.calls).toEqual([['--- SETUP ---'], ['body'], ['-------------']]);
  });

  it('prints an empty item list and ignores an empty heading', () => {
    log([], { client: 1 }, '');
    expect(consoleLog.mock.calls).toEqual([[]]);
  });
});
