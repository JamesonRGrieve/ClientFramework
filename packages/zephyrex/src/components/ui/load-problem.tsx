// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { AlertCircle } from 'lucide-react';
import type { ReactElement } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RetryRing } from '@/components/ui/retry-ring';
import { useRetryCountdown } from '@/lib/zephyrex/useRetryCountdown';

const NO_RETRY = async (): Promise<void> => Promise.resolve();

/**
 * Something a page needed did not load: what it was in plain words, the server's reason under it,
 * and a way to try again in place. With `onRetry` it also tries again by itself every 10 s, the
 * button's ring emptying as the count runs (a server that is booting comes back on its own).
 */
export function LoadProblem({
  what,
  error,
  onRetry,
  autoRetry = true,
}: {
  /** What did not load, as a sentence would name it: "your gift list". */
  what: string;
  error?: Error | undefined;
  /** Loads it again (an SWR `mutate`); without it, no button. */
  onRetry?: (() => Promise<unknown>) | undefined;
  /** false: only the button tries again, never the clock. */
  autoRetry?: boolean;
}): ReactElement {
  const { secondsLeft, totalSeconds, retrying, retryNow } = useRetryCountdown(onRetry ?? NO_RETRY, {
    enabled: onRetry !== undefined && autoRetry,
  });
  return (
    <Alert variant='destructive' className='flex items-start gap-3'>
      <span aria-hidden='true' className='mt-0.5 shrink-0'>
        <AlertCircle className='size-4' />
      </span>
      <div className='grid min-w-0 flex-1 gap-1'>
        <AlertTitle className='mb-0'>{`${what.charAt(0).toUpperCase()}${what.slice(1)} could not be loaded.`}</AlertTitle>
        {error !== undefined && (
          <AlertDescription className='text-muted-foreground [overflow-wrap:anywhere]'>{error.message}</AlertDescription>
        )}
        {onRetry !== undefined && autoRetry && (
          <p className='text-xs text-muted-foreground'>
            {/* The count is shown, not announced each second; the live line says when a try starts. */}
            <span aria-hidden='true'>{retrying ? 'Trying again…' : `Trying again in ${String(secondsLeft)} s…`}</span>
            <span className='sr-only' aria-live='polite'>
              {retrying ? 'Trying again.' : 'It will try again every 10 seconds.'}
            </span>
          </p>
        )}
      </div>
      {onRetry !== undefined && (
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='shrink-0 text-foreground'
          disabled={retrying}
          onClick={retryNow}
        >
          <RetryRing
            secondsLeft={autoRetry ? secondsLeft : totalSeconds}
            totalSeconds={totalSeconds}
            retrying={retrying}
            className='size-3.5'
          />
          Try again
        </Button>
      )}
    </Alert>
  );
}
