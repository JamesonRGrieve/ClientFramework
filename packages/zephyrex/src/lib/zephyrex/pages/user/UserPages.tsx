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
}

/**
 * The auth router configured from the app's ZephyrexConfig, with zephyrex's own account page at
 * `<authPath>/manage`, where signing in lands, and the pages the app's extensions add.
 */
export function UserPages({ slug, sections }: UserPagesProps): ReactNode {
  const { config } = useZephyrexConfig();
  const extensionPages = Object.fromEntries(
    extensionAuthPages(config).map(({ path, component: Page }) => [path, <Page key={path} />]),
  );
  return (
    <AuthRouter
      params={{ slug }}
      corePagesConfig={{
        ...authPagesConfig(config),
        register: { path: '/register', heading: 'Welcome, Please Register' },
        manage: { path: MANAGE_PATH, heading: 'Account Management' },
      }}
      additionalPages={{
        ...extensionPages,
        [MANAGE_PATH]: <Manage heading='Account Management' sections={sections} />,
      }}
    />
  );
}
