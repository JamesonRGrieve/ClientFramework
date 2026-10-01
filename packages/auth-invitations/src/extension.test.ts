// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { authInvitationsExtension as registered } from 'zephyrex/extensions/auth_invitations';
import { authInvitationsExtension } from './extension';
import { PendingInvitations } from './Invitations';
import { TeamInvitations } from './TeamInvitations';

describe('authInvitationsExtension', () => {
  it('is the registered auth_invitations extension, with its account-page and team-page sections', () => {
    expect(authInvitationsExtension).toMatchObject({ name: 'auth_invitations', serverExtension: 'auth_invitations' });
    expect(authInvitationsExtension.displayName).toBe(registered.displayName);
    expect(authInvitationsExtension.managementTabs).toEqual([
      expect.objectContaining({ id: 'invitations', label: 'Invitations', component: PendingInvitations }),
    ]);
    expect(authInvitationsExtension.teamSections).toEqual([TeamInvitations]);
  });
});
