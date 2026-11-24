'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import AuthRouter from '@zephyrex/auth/Router';
import type { ReactNode } from 'react';
import { useZephyrexConfig } from '../../ZephyrexProvider';
import { Manage } from './account/Manage';
import { authPagesConfig, extensionAuthPages } from './authPagesConfig';

const MANAGE_PATH = '/manage';

export interface UserPagesProps {
  slug: string[];
  /** Extra account-page sections (the extensions' management tabs). */
  sections: ReactNode;
  /** Whether sign-up is open (REGISTRATION_MODE isn't closed); when not, the welcome page offers sign-in only. */
  signupOpen?: boolean;
  /** The app's waitlist page, which the welcome page links to while sign-up is closed. */
  waitlistPath?: string | undefined;
}

/**
 * The auth router configured from the app's ZephyrexConfig, with zephyrex's own account page at
 * `<authPath>/manage`, where signing in lands, and the pages the app's extensions add.
 */
export function UserPages({ slug, sections, signupOpen = true, waitlistPath }: UserPagesProps): ReactNode {
  const { config } = useZephyrexConfig();
  const extensionPages = Object.fromEntries(
    extensionAuthPages(config).map(({ path, component: Page }) => [path, <Page key={path} />]),
  );
  return (
    <AuthRouter
      params={{ slug }}
      corePagesConfig={{
        ...authPagesConfig(config),
        signupOpen,
        ...(waitlistPath === undefined ? {} : { waitlistPath }),
        register: { path: '/register', heading: 'Create your account' },
        manage: { path: MANAGE_PATH, heading: 'Your account' },
      }}
      additionalPages={{
        ...extensionPages,
        [MANAGE_PATH]: <Manage heading='Your account' sections={sections} />,
      }}
    />
  );
}
