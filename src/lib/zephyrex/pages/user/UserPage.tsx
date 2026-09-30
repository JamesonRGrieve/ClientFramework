// SPDX-License-Identifier: AGPL-3.0-or-later
import AuthRouter from '@zephyrex/auth/Router';
import { type ReactNode, Suspense } from 'react';
import { ManagementSections } from '../../ManagementTabRegistry';

export interface UserPageProps {
  params: Promise<{ slug?: string[] }>;
}

/**
 * Every /user route: sign-in, registration and the account page with the sections extensions
 * add (mount as `app/user/[[...slug]]/page.tsx`).
 */
export async function UserPage({ params }: UserPageProps): Promise<ReactNode> {
  const { slug = [] } = await params;
  return (
    <Suspense fallback={<p className='p-4 text-sm text-muted-foreground'>Loading…</p>}>
      <AuthRouter
        params={{ slug }}
        corePagesConfig={{
          register: { path: '/register', heading: 'Welcome, Please Register' },
          manage: {
            path: '/manage',
            heading: 'Account Management',
            props: { sections: <ManagementSections /> },
          },
        }}
        additionalPages={{}}
      />
    </Suspense>
  );
}
