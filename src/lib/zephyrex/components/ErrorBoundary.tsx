// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ApiError } from '../client';

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
    this.setState({ error: null });
  };

  override render() {
    if (this.state.error) {
      const { error } = this.state;
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback(error, this.retry);
      }

      if (fallback) return fallback;

      const isServerDown = error instanceof ApiError && error.status >= 500;

      return (
        <div className='flex min-h-[200px] flex-col items-center justify-center gap-4 p-8'>
          <h2 className='text-xl font-semibold'>{isServerDown ? 'Server Unavailable' : 'Something went wrong'}</h2>
          <p className='text-sm text-muted-foreground'>
            {isServerDown ? 'The server is not responding. Please try again later.' : error.message}
          </p>
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
