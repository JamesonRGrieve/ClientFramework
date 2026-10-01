// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/auth-session', () => {
  it('publishes the sessions section, its schema and the extension that mounts it', () => {
    expect(Object.keys(published).sort()).toEqual(
      ['SESSIONS_ENDPOINT', 'SessionSchema', 'Sessions', 'authSessionExtension', 'sessionLabel'].sort(),
    );
    expect(published.SESSIONS_ENDPOINT).toBe('/v1/session');
  });
});
