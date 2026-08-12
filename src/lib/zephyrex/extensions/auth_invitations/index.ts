// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import type { ZephyrexClientExtension } from '../types';

const Invitations = lazy(() => import('@zephyrex/auth/management/Invitations'));
const Invite = lazy(() => import('@zephyrex/auth/management/Invite'));

export const authInvitationsExtension: ZephyrexClientExtension = {
  name: 'auth_invitations',
  displayName: 'Invitations',
  description: 'Team invitation management',
  serverExtension: 'auth_invitations',
  managementTabs: [
    { id: 'invitations', label: 'Invitations', component: () => Invitations({}), priority: 30 },
  ],
};
