// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { ErrorBoundary } from './ErrorBoundary';
import { ApiError } from '../client';

function ThrowError({ error }: { error: Error }) {
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

  it('renders server down message for 500+ errors', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError error={new ApiError(502, 'Bad Gateway')} />
        </ErrorBoundary>
      </TestWrapper>,
    );
    expect(screen.getByText('Server Unavailable')).toBeInTheDocument();
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
