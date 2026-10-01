// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/auth-api-keys', () => {
  it('publishes the API keys section, its schemas and the extension that mounts it', () => {
    expect(Object.keys(published).sort()).toEqual(
      ['API_KEYS_ENDPOINT', 'ApiKeySchema', 'ApiKeys', 'IssuedKeySchema', 'authApiKeysExtension', 'expiryFromDate'].sort(),
    );
    expect(published.API_KEYS_ENDPOINT).toBe('/v1/auth/api-keys');
  });
});
