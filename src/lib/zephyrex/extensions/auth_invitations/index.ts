// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import { createExtension } from '../createExtension';

const Invitations = lazy(() =>
  import('@zephyrex/auth/management/Invitations').then((m) => ({ default: m.InvitationsTable })),
);

export const authInvitationsExtension = createExtension('auth_invitations', {
  displayName: 'Invitations',
  description: 'Team invitation management',
  managementTabs: [{ id: 'invitations', label: 'Invitations', component: () => Invitations({}), priority: 30 }],
});
