// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// The account-page and team-page sections ship in @zephyrex/auth-invitations, which extends this entry.
export const authInvitationsExtension = createExtension('auth_invitations', {
  displayName: 'Invitations',
  description: 'Team invitation management',
});
