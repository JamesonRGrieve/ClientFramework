// SPDX-License-Identifier: AGPL-3.0-or-later
import { type ReactNode, Suspense } from 'react';
import AuthRouter from '@zephyrex/auth/Router';

interface UserRouterProps {
  params: Promise<{ slug?: string[] }>;
}

// Properly handle params as an async value in Next.js 15
export default async function UserRouter({ params }: UserRouterProps): Promise<ReactNode> {
  // Await the params to satisfy Next.js 15 requirements
  const resolvedParams = await params;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthRouter
        params={{
          // Pass slug without accessing it directly from the original params
          slug: resolvedParams.slug ?? [],
        }}
        corePagesConfig={{
          register: {
            path: '/register',
            heading: 'Welcome, Please Register',
          },
        }}
        additionalPages={{}}
      />
    </Suspense>
  );
}
