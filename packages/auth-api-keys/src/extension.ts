// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { authApiKeysExtension as registered } from 'zephyrex/extensions/auth_api_keys';
import { ApiKeys } from './ApiKeys';

const API_KEYS_PRIORITY = 25;

/** The auth_api_keys client extension with its account-page section, for an app's `extensions`. */
export const authApiKeysExtension: ZephyrexClientExtension = {
  ...registered,
  managementTabs: [{ id: 'api-keys', label: 'API Keys', component: ApiKeys, priority: API_KEYS_PRIORITY }],
};
