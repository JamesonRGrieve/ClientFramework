// SPDX-License-Identifier: AGPL-3.0-or-later
import { lazy } from 'react';
import type { ZephyrexClientExtension } from '../types';

const Invitations = lazy(() => import('@zephyrex/auth/management/Invitations'));

export const authInvitationsExtension: ZephyrexClientExtension = {
  name: 'auth_invitations',
  displayName: 'Invitations',
  description: 'Team invitation management',
  serverExtension: 'auth_invitations',
  navItems: [{ title: 'Invitations', url: '/user/manage' }],
};
