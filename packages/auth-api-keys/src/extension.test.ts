// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { authApiKeysExtension as registered } from 'zephyrex/extensions/auth_api_keys';
import { ApiKeys } from './ApiKeys';
import { authApiKeysExtension } from './extension';

describe('authApiKeysExtension', () => {
  it('is the registered auth_api_keys extension, with the API keys section on the account page', () => {
    expect(authApiKeysExtension).toMatchObject({ name: 'auth_api_keys', serverExtension: 'auth_api_keys' });
    expect(authApiKeysExtension.displayName).toBe(registered.displayName);
    expect(authApiKeysExtension.managementTabs).toEqual([
      expect.objectContaining({ id: 'api-keys', label: 'API Keys', component: ApiKeys }),
    ]);
  });
});
