// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from './copy-button';

const FEEDBACK_MS = 2000;

const withClipboard = (writeText: (text: string) => Promise<void>): void => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
};

describe('CopyButton', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies its content and confirms it, then goes back to its label', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    // After setup, which installs a clipboard of its own.
    const writeText = vi.fn(async () => Promise.resolve());
    withClipboard(writeText);
    render(<CopyButton content='KEY123' label='Copy key' />);
    await user.click(screen.getByRole('button', { name: 'Copy key' }));
    expect(writeText).toHaveBeenCalledWith('KEY123');
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(FEEDBACK_MS);
    });
    expect(screen.getByRole('button', { name: 'Copy key' })).toBeInTheDocument();
  });

  it('says when the clipboard refused', async () => {
    const user = userEvent.setup();
    withClipboard(async () => Promise.reject(new Error('denied')));
    render(<CopyButton content='KEY123' />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByText('Copy failed')).toBeInTheDocument();
  });
});
