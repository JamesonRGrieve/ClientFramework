// SPDX-License-Identifier: AGPL-3.0-or-later
// One client extension per extension bundled with the Zephyrex server, name-for-name: the
// registry's metadata. An extension with client code ships it as @zephyrex/<extension>, whose
// extension object extends the entry here.
import type { ZephyrexClientExtension } from '../types';
import { aclRbacExtension } from './acl_rbac';
import { auditRetentionExtension } from './audit_retention';
import { authApiKeysExtension } from './auth_api_keys';
import { authDevicePairingExtension } from './auth_device_pairing';
import { authInvitationsExtension } from './auth_invitations';
import { authLockoutExtension } from './auth_lockout';
import { authMagicLinkExtension } from './auth_magic_link';
import { authMarketplaceExtension } from './auth_marketplace';
import { authMergeExtension } from './auth_merge';
import { authMfaExtension } from './auth_mfa';
import { authNotificationsExtension } from './auth_notifications';
import { authOauth2ClientExtension } from './auth_oauth2_client';
import { authPrivacyExtension } from './auth_privacy';
import { authRecoveryQuestionsExtension } from './auth_recovery_questions';
import { authSessionExtension } from './auth_session';
import { backupRestoreExtension } from './backup_restore';
import { databaseExtension } from './database';
import { databaseMemoryExtension } from './database_memory';
import { emailExtension } from './email';
import { federationExtension } from './federation';
import { fileioExtension } from './fileio';
import { genealogyExtension } from './genealogy';
import { mediaExtension } from './media';
import { messagingExtension } from './messaging';
import { metadataExtension } from './metadata';
import { metaLabelsExtension } from './meta_labels';
import { metaLoggingExtension } from './meta_logging';
import { metaSdkPyExtension } from './meta_sdk_py';
import { metaSdkRsExtension } from './meta_sdk_rs';
import { metaSdkTsExtension } from './meta_sdk_ts';
import { observabilityExtension } from './observability';
import { privacyExtension } from './privacy';
import { quotaExtension } from './quota';
import { secretVaultExtension } from './secret_vault';
import { smsExtension } from './sms';
import { webhooksExtension } from './webhooks';
import { wikiExtension } from './wiki';

export {
  aclRbacExtension,
  auditRetentionExtension,
  authApiKeysExtension,
  authDevicePairingExtension,
  authInvitationsExtension,
  authLockoutExtension,
  authMagicLinkExtension,
  authMarketplaceExtension,
  authMergeExtension,
  authMfaExtension,
  authNotificationsExtension,
  authOauth2ClientExtension,
  authPrivacyExtension,
  authRecoveryQuestionsExtension,
  authSessionExtension,
  backupRestoreExtension,
  databaseExtension,
  databaseMemoryExtension,
  emailExtension,
  federationExtension,
  fileioExtension,
  genealogyExtension,
  mediaExtension,
  messagingExtension,
  metadataExtension,
  metaLabelsExtension,
  metaLoggingExtension,
  metaSdkPyExtension,
  metaSdkRsExtension,
  metaSdkTsExtension,
  observabilityExtension,
  privacyExtension,
  quotaExtension,
  secretVaultExtension,
  smsExtension,
  webhooksExtension,
  wikiExtension,
};

export { createExtension } from './createExtension';

export const allExtensions: ZephyrexClientExtension[] = [
  aclRbacExtension,
  auditRetentionExtension,
  authApiKeysExtension,
  authDevicePairingExtension,
  authInvitationsExtension,
  authLockoutExtension,
  authMagicLinkExtension,
  authMarketplaceExtension,
  authMergeExtension,
  authMfaExtension,
  authNotificationsExtension,
  authOauth2ClientExtension,
  authPrivacyExtension,
  authRecoveryQuestionsExtension,
  authSessionExtension,
  backupRestoreExtension,
  databaseExtension,
  databaseMemoryExtension,
  emailExtension,
  federationExtension,
  fileioExtension,
  genealogyExtension,
  mediaExtension,
  messagingExtension,
  metadataExtension,
  metaLabelsExtension,
  metaLoggingExtension,
  metaSdkPyExtension,
  metaSdkRsExtension,
  metaSdkTsExtension,
  observabilityExtension,
  privacyExtension,
  quotaExtension,
  secretVaultExtension,
  smsExtension,
  webhooksExtension,
  wikiExtension,
];
