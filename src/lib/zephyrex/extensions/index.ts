// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';
import { aclRbacExtension } from './acl_rbac';
import { auditRetentionExtension } from './audit_retention';
import { authApiKeysExtension } from './auth_api_keys';
import { authDevicePairingExtension } from './auth_device_pairing';
import { authInvitationsExtension } from './auth_invitations';
import { authKerberosExtension } from './auth_kerberos';
import { authLdapExtension } from './auth_ldap';
import { authLockoutExtension } from './auth_lockout';
import { authMagicLinkExtension } from './auth_magic_link';
import { authMarketplaceExtension } from './auth_marketplace';
import { authMergeExtension } from './auth_merge';
import { authMfaExtension } from './auth_mfa';
import { authNotificationsExtension } from './auth_notifications';
import { authOauthExtension } from './auth_oauth';
import { authPrivacyExtension } from './auth_privacy';
import { authRadiusExtension } from './auth_radius';
import { authRecoveryQuestionsExtension } from './auth_recovery_questions';
import { authSamlExtension } from './auth_saml';
import { authSessionExtension } from './auth_session';
import { authWebauthnExtension } from './auth_webauthn';
import { backupRestoreExtension } from './backup_restore';
import { billingExtension } from './billing';
import { databaseExtension } from './database';
import { databaseMemoryExtension } from './database_memory';
import { emailExtension } from './email';
import { federationExtension } from './federation';
import { fileioExtension } from './fileio';
import { forwardAuthConsumerExtension } from './forward_auth_consumer';
import { forwardAuthProviderExtension } from './forward_auth_provider';
import { genealogyExtension } from './genealogy';
import { kerberosConsumerExtension } from './kerberos_consumer';
import { kerberosProviderExtension } from './kerberos_provider';
import { ldapConsumerExtension } from './ldap_consumer';
import { ldapProviderExtension } from './ldap_provider';
import { metadataExtension } from './metadata';
import { metaLabelsExtension } from './meta_labels';
import { metaLoggingExtension } from './meta_logging';
import { oauthConsumerExtension } from './oauth_consumer';
import { oauthProviderExtension } from './oauth_provider';
import { oidcConsumerExtension } from './oidc_consumer';
import { oidcProviderExtension } from './oidc_provider';
import { paymentExtension } from './payment';
import { privacyExtension } from './privacy';
import { proxyAuthConsumerExtension } from './proxy_auth_consumer';
import { proxyAuthProviderExtension } from './proxy_auth_provider';
import { quotaExtension } from './quota';
import { radiusConsumerExtension } from './radius_consumer';
import { radiusProviderExtension } from './radius_provider';
import { rpgLogExtension } from './rpg_log';
import { rpgStateExtension } from './rpg_state';
import { samlConsumerExtension } from './saml_consumer';
import { samlProviderExtension } from './saml_provider';
import { scimConsumerExtension } from './scim_consumer';
import { scimProviderExtension } from './scim_provider';
import { webauthnConsumerExtension } from './webauthn_consumer';
import { webauthnProviderExtension } from './webauthn_provider';
import { webhooksExtension } from './webhooks';
import { x509ConsumerExtension } from './x509_consumer';
import { x509ProviderExtension } from './x509_provider';

export {
  aclRbacExtension,
  auditRetentionExtension,
  authApiKeysExtension,
  authDevicePairingExtension,
  authInvitationsExtension,
  authKerberosExtension,
  authLdapExtension,
  authLockoutExtension,
  authMagicLinkExtension,
  authMarketplaceExtension,
  authMergeExtension,
  authMfaExtension,
  authNotificationsExtension,
  authOauthExtension,
  authPrivacyExtension,
  authRadiusExtension,
  authRecoveryQuestionsExtension,
  authSamlExtension,
  authSessionExtension,
  authWebauthnExtension,
  backupRestoreExtension,
  billingExtension,
  databaseExtension,
  databaseMemoryExtension,
  emailExtension,
  federationExtension,
  fileioExtension,
  forwardAuthConsumerExtension,
  forwardAuthProviderExtension,
  genealogyExtension,
  kerberosConsumerExtension,
  kerberosProviderExtension,
  ldapConsumerExtension,
  ldapProviderExtension,
  metadataExtension,
  metaLabelsExtension,
  metaLoggingExtension,
  oauthConsumerExtension,
  oauthProviderExtension,
  oidcConsumerExtension,
  oidcProviderExtension,
  paymentExtension,
  privacyExtension,
  proxyAuthConsumerExtension,
  proxyAuthProviderExtension,
  quotaExtension,
  radiusConsumerExtension,
  radiusProviderExtension,
  rpgLogExtension,
  rpgStateExtension,
  samlConsumerExtension,
  samlProviderExtension,
  scimConsumerExtension,
  scimProviderExtension,
  webauthnConsumerExtension,
  webauthnProviderExtension,
  webhooksExtension,
  x509ConsumerExtension,
  x509ProviderExtension,
};

export { createExtension } from './createExtension';

export const allExtensions: ZephyrexClientExtension[] = [
  aclRbacExtension,
  auditRetentionExtension,
  authApiKeysExtension,
  authDevicePairingExtension,
  authInvitationsExtension,
  authKerberosExtension,
  authLdapExtension,
  authLockoutExtension,
  authMagicLinkExtension,
  authMarketplaceExtension,
  authMergeExtension,
  authMfaExtension,
  authNotificationsExtension,
  authOauthExtension,
  authPrivacyExtension,
  authRadiusExtension,
  authRecoveryQuestionsExtension,
  authSamlExtension,
  authSessionExtension,
  authWebauthnExtension,
  backupRestoreExtension,
  billingExtension,
  databaseExtension,
  databaseMemoryExtension,
  emailExtension,
  federationExtension,
  fileioExtension,
  forwardAuthConsumerExtension,
  forwardAuthProviderExtension,
  genealogyExtension,
  kerberosConsumerExtension,
  kerberosProviderExtension,
  ldapConsumerExtension,
  ldapProviderExtension,
  metadataExtension,
  metaLabelsExtension,
  metaLoggingExtension,
  oauthConsumerExtension,
  oauthProviderExtension,
  oidcConsumerExtension,
  oidcProviderExtension,
  paymentExtension,
  privacyExtension,
  proxyAuthConsumerExtension,
  proxyAuthProviderExtension,
  quotaExtension,
  radiusConsumerExtension,
  radiusProviderExtension,
  rpgLogExtension,
  rpgStateExtension,
  samlConsumerExtension,
  samlProviderExtension,
  scimConsumerExtension,
  scimProviderExtension,
  webauthnConsumerExtension,
  webauthnProviderExtension,
  webhooksExtension,
  x509ConsumerExtension,
  x509ProviderExtension,
];
