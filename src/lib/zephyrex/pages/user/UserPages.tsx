'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import AuthRouter from '@zephyrex/auth/Router';
import type { ReactNode } from 'react';
import { useZephyrexConfig } from '../../ZephyrexProvider';
import { authPagesConfig } from './authPagesConfig';

export interface UserPagesProps {
  slug: string[];
  /** Extra account-page sections (the extensions' management tabs). */
  sections: ReactNode;
}

/** The auth router configured from the app's ZephyrexConfig. */
export function UserPages({ slug, sections }: UserPagesProps): ReactNode {
  const { config } = useZephyrexConfig();
  return (
    <AuthRouter
      params={{ slug }}
      corePagesConfig={{
        ...authPagesConfig(config),
        register: { path: '/register', heading: 'Welcome, Please Register' },
        manage: { path: '/manage', heading: 'Account Management', props: { sections } },
      }}
      additionalPages={{}}
    />
  );
}
