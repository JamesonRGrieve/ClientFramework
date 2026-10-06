// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { webauthnConsumerExtension as registered } from 'zephyrex/extensions';
import { webauthnConsumerExtension } from './extension';
import { Passkeys } from './Passkeys';

describe('webauthnConsumerExtension', () => {
  it('is the registered extension, turning on passkey sign-in and adding the Passkeys section', () => {
    expect(webauthnConsumerExtension).toMatchObject({ name: registered.name, displayName: registered.displayName });
    expect(webauthnConsumerExtension.authModes).toEqual({ passkey: true });
    expect(webauthnConsumerExtension.managementTabs).toEqual([
      { id: 'passkeys', label: 'Passkeys', component: Passkeys, priority: 20 },
    ]);
  });
});
