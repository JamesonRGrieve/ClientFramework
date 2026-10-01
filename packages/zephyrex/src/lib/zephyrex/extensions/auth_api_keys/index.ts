// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, lazy } from 'react';
import { createExtension } from '../createExtension';

const ApiKeys = lazy(async () => import('@zephyrex/auth/management/ApiKeys').then((m) => ({ default: m.ApiKeys })));

export const authApiKeysExtension = createExtension('auth_api_keys', {
  displayName: 'API Keys',
  description: 'API key generation and management',
  managementTabs: [{ id: 'api-keys', label: 'API Keys', component: () => createElement(ApiKeys), priority: 25 }],
});
