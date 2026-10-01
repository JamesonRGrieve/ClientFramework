// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { authInvitationsExtension as registered } from 'zephyrex/extensions/auth_invitations';
import { PendingInvitations } from './Invitations';
import { TeamInvitations } from './TeamInvitations';

const INVITATIONS_PRIORITY = 60;

/**
 * The auth_invitations client extension, for an app's `extensions`: the invitations awaiting the
 * user's answer on the account page, and the invite form and pending invitations on the team page.
 */
export const authInvitationsExtension: ZephyrexClientExtension = {
  ...registered,
  managementTabs: [
    { id: 'invitations', label: 'Invitations', component: PendingInvitations, priority: INVITATIONS_PRIORITY },
  ],
  teamSections: [TeamInvitations],
};
