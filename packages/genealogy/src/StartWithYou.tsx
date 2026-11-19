// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, useState } from 'react';
import { useClient, useUser } from 'zephyrex';
import { genealogyApi } from './genealogyApi';

/** The user's own name for their record of themselves: their full name, else their email. */
const ownName = (user: {
  email: string;
  first_name?: string | null | undefined;
  last_name?: string | null | undefined;
}): string =>
  [user.first_name, user.last_name].filter((part) => part !== null && part !== undefined && part.trim() !== '').join(' ') ||
  user.email;

/**
 * Asked when the user has no record of themselves yet: one press adds it, linked to their account,
 * and the page loads around it. The polycule map and the People list both start here.
 */
export function StartWithYou({
  onStarted,
  heading = 'Start your map with you',
  description = 'You go in the middle. Then add the people you are connected to, whether they are on here or not.',
}: {
  onStarted: () => Promise<unknown>;
  heading?: string | undefined;
  description?: string | undefined;
}): ReactElement {
  const client = useClient();
  const { data: user } = useUser();
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const start = async (): Promise<void> => {
    if (user === undefined) {
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await genealogyApi.createPerson(client, { name: ownName(user), linked_user_id: user.id });
      await onStarted();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'You could not be added.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className='grid justify-items-center gap-3 px-4 py-8 text-center'>
      <svg aria-hidden='true' viewBox='0 0 64 40' className='h-16 w-24 text-primary'>
        <g fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' opacity='0.5'>
          <path d='M32 20 12 10M32 20l20-10M32 20v14' strokeDasharray='3 4' />
        </g>
        <circle cx='32' cy='20' r='7' fill='currentColor' />
        <circle cx='12' cy='10' r='4' fill='none' stroke='currentColor' strokeWidth='2' />
        <circle cx='52' cy='10' r='4' fill='none' stroke='currentColor' strokeWidth='2' />
        <circle cx='32' cy='35' r='4' fill='none' stroke='currentColor' strokeWidth='2' />
      </svg>
      <h3 className='text-base font-semibold'>{heading}</h3>
      <p className='max-w-md text-sm text-muted-foreground'>{description}</p>
      <Button
        disabled={user === undefined || busy}
        onClick={() => {
          void start();
        }}
      >
        Add myself
      </Button>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}
