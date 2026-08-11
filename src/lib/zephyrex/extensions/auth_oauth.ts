// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from '../types';

export const authOauthExtension: ZephyrexClientExtension = {
  name: 'auth_oauth',
  displayName: 'OAuth2 Authentication',
  description: '50+ OAuth2 provider integrations',
  serverExtension: 'auth_oauth',
  // OAuth2 providers render automatically in the auth flow via
  // @zephyrex/auth/oauth2/OAuthProviders when provider client IDs
  // are configured as environment variables.
};
