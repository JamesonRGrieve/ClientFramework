// SPDX-License-Identifier: AGPL-3.0-or-later
// How a passkey or security key reads in the list.
import { shownTime } from 'zephyrex';
import type { PasskeyCredential } from './credentialsApi';

/** The user's name for a credential, or what kind it is when unnamed. */
export const credentialName = ({ device_name: name, is_discoverable: discoverable }: PasskeyCredential): string =>
  (name ?? '') === '' ? (discoverable ? 'Unnamed passkey' : 'Unnamed security key') : (name ?? '');

/** What kind of credential it is, and where it lives. */
export function credentialKind({ is_discoverable: discoverable, backed_up: synced }: PasskeyCredential): string {
  if (!discoverable) {
    return 'Security key (a second factor after your password)';
  }
  return synced ? 'Passkey, synced across your devices' : 'Passkey on one device';
}

/** Whether it can be used, and when it last was. */
export function credentialStatus(credential: PasskeyCredential): string {
  if (credential.is_enabled) {
    const used = shownTime(credential.last_used_at);
    return used === '' ? 'Never used' : `Last used ${used}`;
  }
  const detected = shownTime(credential.clone_detected_at);
  return detected === ''
    ? 'Disabled'
    : `Disabled ${detected}: it presented a signature counter that went backwards, so it may have been copied. Remove it.`;
}
