// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const authApiKeysExtension: ZephyrexClientExtension = {
  name: 'auth_api_keys',
  displayName: 'API Keys',
  description: 'API key generation and management for programmatic access',
  serverExtension: 'auth_api_keys',
  navItems: [{ title: 'API Keys', url: '/user/manage' }],
};
