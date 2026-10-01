'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { usePasswordPolicy } from '@zephyrex/auth/hooks/usePasswordPolicy';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactNode, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import log from '../../../../log';
import { useTeams } from '../../../hooks';
import { useZephyrexConfig } from '../../../ZephyrexProvider';
import { PendingInvitations } from '../../team/Invitations';
import { Account } from './Account';
import { Profile } from './Profile';
import { detectTimezone } from './profileModel';
import { useProfile } from './useProfile';

export type ManageProps = {
  /** The page's heading; none when omitted. */
  heading?: string;
  /** Where "Go to <app>" leads. */
  returnPath?: string;
  /** Extra account sections an app or its extensions add below the built-in ones (e.g. two-factor authentication). */
  sections?: ReactNode;
};

function Teams(): ReactNode {
  const { data: teams = [] } = useTeams();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
        <CardDescription>The teams you belong to.</CardDescription>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className='text-sm text-muted-foreground'>You are not a member of any team yet.</p>
        ) : (
          <ul aria-label='Your teams' className='divide-y rounded-md border'>
            {teams.map((team) => (
              <li key={team.id}>
                <Link href={`/team/${team.id}`} className='block px-4 py-3 text-sm font-medium hover:bg-muted'>
                  {team.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** The signed-in user's account page: profile, password, teams and pending invitations. */
export function Manage({ heading, returnPath = '/', sections }: ManageProps): ReactNode {
  const router = useRouter();
  const { config } = useZephyrexConfig();
  // Email sign-in is by password unless the app turns it off.
  const passwords = config.auth?.authModes?.basic ?? true;
  const { profile, error, isLoading, update, changePassword } = useProfile();
  const { data: passwordPolicy } = usePasswordPolicy(config.server.baseUrl, passwords);

  // A new account has no timezone; record the browser's once so times render locally.
  const timezoneRecorded = useRef(false);
  useEffect(() => {
    if (profile === undefined || (profile.timezone ?? '') !== '' || timezoneRecorded.current) {
      return;
    }
    timezoneRecorded.current = true;
    void (async (): Promise<void> => {
      try {
        await update({ timezone: detectTimezone() });
      } catch (failure) {
        log(['Recording the browser timezone failed', failure], { client: 1 });
      }
    })();
  }, [profile, update]);

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='flex items-center justify-between gap-2'>
        {heading !== undefined && heading !== '' && <h2 className='text-3xl font-semibold'>{heading}</h2>}
        <Button
          onClick={() => {
            router.push(returnPath);
          }}
        >
          Go to {config.app.name}
        </Button>
      </div>
      {isLoading ? (
        <p className='text-sm text-muted-foreground'>Loading your account…</p>
      ) : error !== undefined || profile === undefined ? (
        <p role='alert' className='text-sm text-destructive'>
          Your account could not be loaded{error === undefined ? '.' : `: ${error.message}`}
        </p>
      ) : (
        <>
          <Profile profile={profile} onSave={update} />
          {passwords && <Account onChangePassword={changePassword} passwordPolicy={passwordPolicy} />}
          {sections}
          <Teams />
          <PendingInvitations />
        </>
      )}
    </main>
  );
}
