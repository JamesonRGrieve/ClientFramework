// SPDX-License-Identifier: AGPL-3.0-or-later
import { createExtension } from '../createExtension';

// Pending invitations are a built-in card on the account page (@zephyrex/auth Manage), so
// this extension adds no section of its own.
export const authInvitationsExtension = createExtension('auth_invitations', {
  displayName: 'Invitations',
  description: 'Team invitation management',
});
