// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's webauthn_consumer extension: passkey sign-in on the auth pages
// (from @zephyrex/auth, switched on by the extension) and the user's passkeys on the account page.
export { webauthnConsumerExtension } from './extension';
export { Passkeys } from './Passkeys';
export { CredentialSchema, registerPasskey, useCredentialActions, useCredentials } from './credentialsApi';
export type { Attachment, CredentialActions, PasskeyCredential } from './credentialsApi';
