// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const authSessionExtension: ZephyrexClientExtension = {
  name: 'auth_session',
  displayName: 'Session Management',
  description: 'Active session tracking and revocation',
  serverExtension: 'auth_session',
  // ConnectedServices component in @zephyrex/auth/management/ConnectedServices
  // renders inside /user/manage via AuthRouter
};
