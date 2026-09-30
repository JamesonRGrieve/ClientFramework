// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { allExtensions } from './index';

// The extensions bundled with the Zephyrex server (server-framework
// src/zephyrex/extensions/*), as agreed with the server maintainers. Update both sides
// together: a client extension exists exactly when its server extension does.
const SERVER_EXTENSIONS = [
  'acl_rbac',
  'audit_retention',
  'auth_api_keys',
  'auth_device_pairing',
  'auth_invitations',
  'auth_lockout',
  'auth_magic_link',
  'auth_marketplace',
  'auth_merge',
  'auth_mfa',
  'auth_notifications',
  'auth_oauth2_client',
  'auth_privacy',
  'auth_recovery_questions',
  'auth_session',
  'backup_restore',
  'billing',
  'database',
  'database_memory',
  'email',
  'federation',
  'fileio',
  'meta_labels',
  'meta_logging',
  'meta_sdk_py',
  'meta_sdk_rs',
  'meta_sdk_ts',
  'metadata',
  'observability',
  'privacy',
  'quota',
  'secret_vault',
  'webhooks',
];

describe('allExtensions', () => {
  it('maps 1:1 onto the server extensions', () => {
    expect(allExtensions.map((extension) => extension.name).sort()).toEqual([...SERVER_EXTENSIONS].sort());
  });

  it('names each extension after the server extension it pairs with', () => {
    for (const extension of allExtensions) {
      expect(extension.serverExtension).toBe(extension.name);
    }
  });
});
