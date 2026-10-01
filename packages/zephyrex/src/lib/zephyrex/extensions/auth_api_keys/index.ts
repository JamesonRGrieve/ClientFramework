// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// The account-page section ships in @zephyrex/auth-api-keys, which extends this entry.
export const authApiKeysExtension = createExtension('auth_api_keys', {
  displayName: 'API Keys',
  description: 'API key generation and management',
});
