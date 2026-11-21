// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoadProblem } from './load-problem';

describe('LoadProblem', () => {
  it('says what did not load and why', () => {
    render(<LoadProblem what='your gift list' error={new Error('Server unavailable')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Your gift list could not be loaded.');
    expect(screen.getByText('Server unavailable')).toBeInTheDocument();
  });

  it('offers no retry without a way to load again', () => {
    render(<LoadProblem what='the network' />);
    expect(screen.queryByRole('button', { name: /Try again/ })).not.toBeInTheDocument();
  });

  it('loads again on Try again, and is busy while it does', async () => {
    let finish: () => void = () => undefined;
    const onRetry = vi.fn(
      async () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<LoadProblem what='your rotas' onRetry={onRetry} />);
    const button = screen.getByRole('button', { name: /Try again/ });
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledOnce();
    expect(button).toBeDisabled();
    finish();
    await vi.waitFor(() => expect(button).toBeEnabled());
  });

  it('tries again by itself every 10 s, saying when the next try is', async () => {
    vi.useFakeTimers();
    try {
      const onRetry = vi.fn(async () => Promise.reject(new Error('still down')));
      render(<LoadProblem what='your rotas' onRetry={onRetry} />);
      expect(screen.getByText('Trying again in 10 s…')).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000);
      });
      expect(screen.getByText('Trying again in 6 s…')).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(onRetry).toHaveBeenCalledOnce();
      expect(screen.getByText('Trying again in 10 s…')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves retrying to the button when autoRetry is off', async () => {
    vi.useFakeTimers();
    try {
      const onRetry = vi.fn(async () => Promise.resolve());
      render(<LoadProblem what='your rotas' onRetry={onRetry} autoRetry={false} />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(onRetry).not.toHaveBeenCalled();
      expect(screen.queryByText(/Trying again in/)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
