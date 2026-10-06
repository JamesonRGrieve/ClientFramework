// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { allExtensions } from './index';

// The extensions bundled with the Zephyrex server (server-framework
// src/zephyrex/extensions/*), as agreed with the server maintainers. Update both sides
// together: a client extension exists exactly when its server extension does.
const SERVER_EXTENSIONS = [
  'acl_rbac',
  'ai',
  'ai_agents',
  'ai_chains',
  'ai_memories',
  'ai_prompts',
  'ai_tuning',
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
  'auth_privacy',
  'auth_recovery_questions',
  'auth_session',
  'automotive',
  'backup_restore',
  'billing',
  'book',
  'cad',
  'calendar',
  'cloud',
  'conversations',
  'crypto',
  'database',
  'database_memory',
  'ecommerce',
  'email',
  'erp',
  'fdm_sla_printing',
  'federation',
  'fileio',
  'forward_auth_consumer',
  'forward_auth_provider',
  'genealogy',
  'health',
  'kerberos_consumer',
  'kerberos_provider',
  'ldap_consumer',
  'ldap_provider',
  'local_ai',
  'local_ai_gguf',
  'local_ai_torch',
  'maps',
  'math',
  'mcp_client',
  'media',
  'messaging',
  'metadata',
  'meta_labels',
  'meta_logging',
  'meta_sdk_py',
  'meta_sdk_rs',
  'meta_sdk_ts',
  'oauth_consumer',
  'oauth_provider',
  'observability',
  'payment',
  'privacy',
  'proxy_auth_consumer',
  'proxy_auth_provider',
  'quota',
  'radius_consumer',
  'radius_provider',
  'saml_consumer',
  'saml_provider',
  'scim_consumer',
  'scim_provider',
  'secret_vault',
  'sms',
  'social',
  'source',
  'wearable',
  'webauthn_consumer',
  'webauthn_provider',
  'webhooks',
  'websearch',
  'wiki',
  'x509_consumer',
  'x509_provider',
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
