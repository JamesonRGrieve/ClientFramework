// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ApiError } from '../client';
import { ErrorBoundary } from './ErrorBoundary';
import { TestWrapper } from '@/testing/TestWrapper';

function ThrowError({ error }: { error: Error }): never {
  throw error;
}

describe('ErrorBoundary', () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <span>OK</span>
        </ErrorBoundary>
      </TestWrapper>,
    );
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders default fallback on error', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError error={new Error('test crash')} />
        </ErrorBoundary>
      </TestWrapper>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('says the server is unavailable for a 5xx and tries again by itself every 10 s', async () => {
    vi.useFakeTimers();
    try {
      let down = true;
      function MaybeDown(): React.JSX.Element {
        if (down) {
          throw new ApiError(502, 'Bad Gateway');
        }
        return <p>Back</p>;
      }
      render(
        <TestWrapper>
          <ErrorBoundary>
            <MaybeDown />
          </ErrorBoundary>
        </TestWrapper>,
      );
      expect(screen.getByText('Server unavailable')).toBeInTheDocument();
      expect(screen.getByText('Trying again in 10 s…')).toBeInTheDocument();
      down = false;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByText('Back')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders custom fallback node', () => {
    render(
      <TestWrapper>
        <ErrorBoundary fallback={<span>Custom Error</span>}>
          <ThrowError error={new Error('boom')} />
        </ErrorBoundary>
      </TestWrapper>,
    );
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('calls onError callback', () => {
    const onError = vi.fn();
    render(
      <TestWrapper>
        <ErrorBoundary onError={onError}>
          <ThrowError error={new Error('tracked')} />
        </ErrorBoundary>
      </TestWrapper>,
    );
    expect(onError).toHaveBeenCalledOnce();
  });

  it('shows retry button', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError error={new Error('retryable')} />
        </ErrorBoundary>
      </TestWrapper>,
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
