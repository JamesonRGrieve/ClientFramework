// SPDX-License-Identifier: AGPL-3.0-or-later
import { type ReactNode, Suspense } from 'react';
import { ManagementSections } from '../../ManagementTabRegistry';
import { signupGateFromEnv } from '../../signupGate';
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
  // Read on the server, where REGISTRATION_MODE is (the same setting the middleware gates sign-up by),
  // so the welcome page offers sign-in only while sign-up is closed.
  const gate = signupGateFromEnv();
  const signupOpen = gate.mode !== 'closed';
  // Where sign-up is sent while closed, when it is a page of this app: the welcome page links to it
  // ("No account yet? Join the waitlist"). An address elsewhere is left to the middleware's bounce.
  const target = gate.disabledPath?.trim() ?? '';
  const waitlistPath = !signupOpen && target.startsWith('/') && !target.startsWith('//') ? target : undefined;
  return (
    <Suspense fallback={<p className='p-4 text-sm text-muted-foreground'>Loading…</p>}>
      <UserPages slug={slug} sections={<ManagementSections />} signupOpen={signupOpen} waitlistPath={waitlistPath} />
    </Suspense>
  );
}
