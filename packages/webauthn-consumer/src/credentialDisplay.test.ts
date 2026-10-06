// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { shownTime } from 'zephyrex';
import { rowOf } from 'zephyrex/testing/msw';
import { credentialKind, credentialName, credentialStatus } from './credentialDisplay';
import { CLONED_ID, credentialsFixture, KEY_ID, LAPTOP_ID } from './credentials.mocks';

describe('credentialDisplay', () => {
  const { credentials } = credentialsFixture();
  const laptop = rowOf(credentials, LAPTOP_ID);
  const key = rowOf(credentials, KEY_ID);
  const cloned = rowOf(credentials, CLONED_ID);

  it('names a credential by its name, or by its kind when unnamed', () => {
    expect([laptop, key, cloned].map(credentialName)).toEqual(['Laptop', 'YubiKey', 'Unnamed passkey']);
    expect(credentialName({ ...key, device_name: '' })).toBe('Unnamed security key');
  });

  it('says what kind each is and where it lives', () => {
    expect([laptop, key, cloned].map(credentialKind)).toEqual([
      'Passkey, synced across your devices',
      'Security key (a second factor after your password)',
      'Passkey on one device',
    ]);
  });

  it('says when it was last used, or why it is disabled', () => {
    expect(credentialStatus(laptop)).toBe(`Last used ${shownTime('2026-10-04T08:00:00')}`);
    expect(credentialStatus(key)).toBe('Never used');
    expect(credentialStatus(cloned)).toMatch(/^Disabled .+: it presented a signature counter that went backwards/);
    expect(credentialStatus({ ...cloned, clone_detected_at: null })).toBe('Disabled');
  });
});
