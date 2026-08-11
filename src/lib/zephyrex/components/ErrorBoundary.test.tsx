// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';
import { ApiError } from '../client';

function ThrowError({ error }: { error: Error }) {
  throw error;
}

describe('ErrorBoundary', () => {
  const originalError = console.error;
  beforeEach(() => { console.error = vi.fn(); });
  afterEach(() => { console.error = originalError; });

  it('renders children when no error', () => {
    render(<ErrorBoundary><span>OK</span></ErrorBoundary>);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders default fallback on error', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new Error('test crash')} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders server down message for 500 errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new ApiError(502, 'Bad Gateway')} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Server Unavailable')).toBeInTheDocument();
  });

  it('renders custom fallback node', () => {
    render(
      <ErrorBoundary fallback={<span>Custom Error</span>}>
        <ThrowError error={new Error('boom')} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('renders fallback function with error info', () => {
    render(
      <ErrorBoundary fallback={(error) => <span>Error: {error.message}</span>}>
        <ThrowError error={new Error('caught')} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Error: caught')).toBeInTheDocument();
  });

  it('calls onError callback', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError error={new Error('tracked')} />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].message).toBe('tracked');
  });

  it('shows retry button in default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError error={new Error('retryable')} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
