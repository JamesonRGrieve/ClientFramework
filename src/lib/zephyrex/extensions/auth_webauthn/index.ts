// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const authWebauthnExtension: ZephyrexClientExtension = {
  name: 'auth_webauthn',
  displayName: 'WebAuthn / Passkeys',
  description: 'FIDO2/WebAuthn hardware key and passkey authentication',
  serverExtension: 'auth_webauthn',
};
