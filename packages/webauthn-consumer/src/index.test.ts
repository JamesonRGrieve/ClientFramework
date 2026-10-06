// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/webauthn-consumer', () => {
  it('publishes the extension, the Passkeys section, and the reads and writes behind it', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'CredentialSchema',
        'Passkeys',
        'registerPasskey',
        'useCredentialActions',
        'useCredentials',
        'webauthnConsumerExtension',
      ].sort(),
    );
  });
});
