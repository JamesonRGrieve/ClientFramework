// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { AlertCircle, RotateCw } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * Something a page needed did not load: what it was in plain words, the server's reason under it,
 * and a way to try again in place.
 */
export function LoadProblem({
  what,
  error,
  onRetry,
}: {
  /** What did not load, as a sentence would name it: "your gift list". */
  what: string;
  error?: Error | undefined;
  /** Loads it again (an SWR `mutate`); without it, no button. */
  onRetry?: (() => Promise<unknown>) | undefined;
}): ReactElement {
  const [retrying, setRetrying] = useState(false);
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
      </div>
      {onRetry !== undefined && (
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='shrink-0 text-foreground'
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            void onRetry().finally(() => setRetrying(false));
          }}
        >
          <RotateCw aria-hidden='true' className={`size-3.5 ${retrying ? 'animate-spin motion-reduce:animate-none' : ''}`} />
          Try again
        </Button>
      )}
    </Alert>
  );
}
