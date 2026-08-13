// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

export const authWebauthnExtension = createExtension('auth_webauthn', {
  displayName: 'WebAuthn / Passkeys',
  description: 'FIDO2/WebAuthn hardware key and passkey authentication',
});
