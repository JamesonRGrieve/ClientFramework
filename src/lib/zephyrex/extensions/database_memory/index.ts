// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

export const databaseMemoryExtension = createExtension('database_memory', {
  displayName: 'In-Memory Store',
  description: 'Valkey/Redis-backed caching, rate limiting, and event streaming',
  navItems: [{ title: 'Cache', url: '/admin/cache' }],
});
