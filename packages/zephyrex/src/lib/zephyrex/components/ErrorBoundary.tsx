// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Component, type ErrorInfo, type ReactElement, type ReactNode, useCallback } from 'react';
import { RetryRing } from '../../../components/ui/retry-ring';
import { isServerErrorStatus } from '../../api/httpStatus';
import { ApiError } from '../client';
import { useRetryCountdown } from '../useRetryCountdown';

/**
 * The server is not answering: tries the failed part again every 10 s (a server that is restarting
 * comes back on its own), with the count shown and a button to try at once.
 */
function ServerDown({ onRetry }: { onRetry: () => void }): ReactElement {
  const retry = useCallback(async (): Promise<void> => {
    onRetry();
    return Promise.resolve();
  }, [onRetry]);
  const { secondsLeft, totalSeconds, retrying, retryNow } = useRetryCountdown(retry);
  return (
    <div className='flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center'>
      <h2 className='text-xl font-semibold'>Server unavailable</h2>
      <p className='text-sm text-muted-foreground'>The server is not responding.</p>
      <p className='flex items-center gap-2 text-sm text-muted-foreground'>
        <RetryRing
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
          retrying={retrying}
          className='size-5 text-primary'
        />
        <span aria-hidden='true'>{`Trying again in ${String(secondsLeft)} s…`}</span>
        <span className='sr-only'>It will try again every 10 seconds.</span>
      </p>
      <button
        type='button'
        onClick={retryNow}
        className='rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90'
      >
        Try again
      </button>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  retry = () => {
    // eslint-disable-next-line react/no-set-state -- an error boundary must be a class, and clearing its error is a state change
    this.setState({ error: null });
  };

  override render() {
    if (this.state.error) {
      const { error } = this.state;
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback(error, this.retry);
      }

      if (fallback !== undefined && fallback !== null) {
        return fallback;
      }

      if (error instanceof ApiError && isServerErrorStatus(error.status)) {
        return <ServerDown onRetry={this.retry} />;
      }

      return (
        <div className='flex min-h-[200px] flex-col items-center justify-center gap-4 p-8'>
          <h2 className='text-xl font-semibold'>Something went wrong</h2>
          <p className='text-sm text-muted-foreground'>{error.message}</p>
          <button
            type='button'
            onClick={this.retry}
            className='rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90'
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
