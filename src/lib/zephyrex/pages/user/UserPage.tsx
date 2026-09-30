// SPDX-License-Identifier: AGPL-3.0-or-later
import { type ReactNode, Suspense } from 'react';
import { ManagementSections } from '../../ManagementTabRegistry';
import { UserPages } from './UserPages';

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
      <UserPages slug={slug} sections={<ManagementSections />} />
    </Suspense>
  );
}
