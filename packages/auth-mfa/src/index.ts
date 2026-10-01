// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's auth_mfa extension (zephyrex[auth-mfa]): the signed-in user's
// second factors, set up and managed from the account page. Answering a challenge at sign-in is
// part of the sign-in flow, in @zephyrex/auth.
export { authMfaExtension } from './extension';
export { MFA_ENDPOINT, MfaMethodSchema, mfaApi, TotpProvisioningSchema, useMfaMethods } from './mfaApi';
export type { MfaMethod, TotpProvisioning } from './mfaApi';
export { MfaSettings } from './MfaSettings';
