// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { safeRedirectPath } from '@zephyrex/auth/lib/redirect';
import { getCookie } from 'cookies-next/client';
import { type ReactNode, useCallback } from 'react';
import { SidebarPage } from '../../../../components/appwrapper/src/SidebarPage';
import { Button } from '../../../../components/ui/button';
import { RetryRing } from '../../../../components/ui/retry-ring';
import { SidebarInset } from '../../../../components/ui/sidebar';
import { useBrowserValue } from '../../../../hooks/useBrowserValue';
import { useRetryCountdown } from '../../useRetryCountdown';

const HOME = '/';
/** Where the auth middleware sends a request while the API is down. */
export const DOWN_PATH = '/down';

/** The page the visitor asked for, as the middleware remembered it in the `href` cookie. */
const interruptedPage = (): string => {
  const interrupted = getCookie('href');
  return safeRedirectPath(typeof interrupted === 'string' ? interrupted : '');
};

/**
 * The page the auth middleware sends a visitor to while the API is down. Every 10 s it asks again
 * for the page they wanted; while the middleware still answers with this page the server is still
 * down and the count starts again, and once the page answers it goes there. An app mounts it with
 * `export { DownPage as default } from 'zephyrex/pages/down'` at `app/down/page.tsx`.
 */
export function DownPage(): ReactNode {
  const wanted = useBrowserValue(interruptedPage, HOME);
  const retry = useCallback(async (): Promise<void> => {
    const answer = await fetch(wanted, { cache: 'no-store', credentials: 'same-origin' });
    if (new URL(answer.url, window.location.href).pathname === DOWN_PATH) {
      throw new Error('The server is still down');
    }
    window.location.assign(wanted);
  }, [wanted]);
  const { secondsLeft, totalSeconds, retrying, retryNow } = useRetryCountdown(retry);

  return (
    <SidebarInset>
      <SidebarPage title=''>
        <div className='grid max-w-prose gap-4'>
          <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>The server isn’t answering</h1>
          <p className='text-muted-foreground'>
            It may be restarting for maintenance, or your connection may have dropped. This page keeps trying and takes you
            back to where you were as soon as it answers.
          </p>
          <div className='flex flex-wrap items-center gap-3'>
            <RetryRing
              secondsLeft={secondsLeft}
              totalSeconds={totalSeconds}
              retrying={retrying}
              className='size-8 text-primary'
            />
            <p className='text-sm text-muted-foreground'>
              <span aria-hidden='true'>{retrying ? 'Trying again…' : `Trying again in ${String(secondsLeft)} s…`}</span>
              <span className='sr-only' aria-live='polite'>
                {retrying ? 'Trying again.' : 'It will try again every 10 seconds.'}
              </span>
            </p>
            <Button type='button' variant='outline' size='sm' disabled={retrying} onClick={retryNow}>
              Try now
            </Button>
          </div>
        </div>
      </SidebarPage>
    </SidebarInset>
  );
}
