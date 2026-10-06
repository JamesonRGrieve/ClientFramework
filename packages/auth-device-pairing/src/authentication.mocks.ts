// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's test and story helpers (never compiled into dist): the pairing pages read the auth
// pages' configuration from AuthenticationContext, as the auth router provides it.
import { render, type RenderResult } from '@testing-library/react';
import { AuthenticationContext, type AuthenticationConfig } from '@zephyrex/auth';
import { type ComponentType, createElement, type ReactElement } from 'react';

export const TEST_AUTH_SERVER = 'https://api.example.com';

/** A complete auth configuration against TEST_AUTH_SERVER, with the pages under `/user`. */
const testAuthConfig: AuthenticationConfig = {
  identify: { path: '/', heading: 'Welcome' },
  login: { path: '/login', heading: 'Please Authenticate' },
  manage: { path: '/manage', heading: 'Account Management' },
  register: { path: '/register', heading: 'Welcome, Please Register' },
  close: { path: '/close', heading: '' },
  magic: { path: '/magic', heading: '' },
  logout: { path: '/logout', heading: '' },
  error: { path: '/error', heading: 'Error' },
  appName: 'Test',
  authPath: '/user',
  authServer: TEST_AUTH_SERVER,
  authModes: { basic: true, magical: false, passkey: false },
  oauthProviders: [],
  signInAlternatives: [],
};

/** Renders `ui` as the auth router would, under the test auth configuration. */
export function renderWithAuthentication(ui: ReactElement): RenderResult {
  return render(createElement(AuthenticationContext, { value: testAuthConfig }, ui));
}

/** A story decorator that renders the story under the test auth configuration. */
export function withAuthentication(Story: ComponentType): ReactElement {
  return createElement(AuthenticationContext, { value: testAuthConfig }, createElement(Story));
}
