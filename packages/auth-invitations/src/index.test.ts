// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/auth-invitations', () => {
  it('publishes the invitation sections, their hooks and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'InviteForm',
        'PendingInvitations',
        'TeamInvitations',
        'USER_INVITATIONS_ENDPOINT',
        'authInvitationsExtension',
        'useInvitationActions',
        'useTeamInvitations',
        'useUserInvitations',
      ].sort(),
    );
    expect(published.USER_INVITATIONS_ENDPOINT).toBe('/v1/user/invitation');
  });
});
