'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import AuthRouter from '@zephyrex/auth/Router';
import type { ReactNode } from 'react';
import { useZephyrexConfig } from '../../ZephyrexProvider';
import { Manage } from './account/Manage';
import { authPagesConfig } from './authPagesConfig';

const MANAGE_PATH = '/manage';

export interface UserPagesProps {
  slug: string[];
  /** Extra account-page sections (the extensions' management tabs). */
  sections: ReactNode;
}

/**
 * The auth router configured from the app's ZephyrexConfig, with zephyrex's own account page at
 * `<authPath>/manage`, where signing in lands.
 */
export function UserPages({ slug, sections }: UserPagesProps): ReactNode {
  const { config } = useZephyrexConfig();
  return (
    <AuthRouter
      params={{ slug }}
      corePagesConfig={{
        ...authPagesConfig(config),
        register: { path: '/register', heading: 'Welcome, Please Register' },
        manage: { path: MANAGE_PATH, heading: 'Account Management' },
      }}
      additionalPages={{ [MANAGE_PATH]: <Manage heading='Account Management' sections={sections} /> }}
    />
  );
}
