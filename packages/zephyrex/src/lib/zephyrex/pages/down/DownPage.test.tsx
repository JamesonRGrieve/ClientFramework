// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DownPage } from './DownPage';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TestWrapper } from '@/testing/TestWrapper';

const SECOND = 1000;
const WANTED = '/scripts/7';

const renderDown = (): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <SidebarProvider>
        <DownPage />
      </SidebarProvider>
    </TestWrapper>,
  );

/** A fetch that answers as if it ended up at `pathname` (the middleware's redirect target). */
const answering = (pathname: string): ReturnType<typeof vi.fn> =>
  vi.fn(async () =>
    Promise.resolve(Object.defineProperty(new Response('ok'), 'url', { value: `http://localhost${pathname}` })),
  );

describe('DownPage', () => {
  let assign: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers();
    document.cookie = 'href=%2Fscripts%2F7; path=/';
    assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, href: 'http://localhost/down', assign });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.cookie = 'href=; max-age=0; path=/';
  });

  it('counts down and asks again every 10 s while the server is still down', async () => {
    const fetching = answering('/down');
    vi.stubGlobal('fetch', fetching);
    renderDown();
    expect(screen.getByRole('heading', { level: 1, name: 'The server isn’t answering' })).toBeInTheDocument();
    expect(screen.getByText('Trying again in 10 s…')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * SECOND);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetching).toHaveBeenCalledWith(WANTED, expect.objectContaining({ cache: 'no-store' }));
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByText('Trying again in 10 s…')).toBeInTheDocument();
  });

  it('goes back to the page asked for once it answers, at once on Try now', async () => {
    vi.stubGlobal('fetch', answering(WANTED));
    renderDown();
    await act(async () => {
      screen.getByRole('button', { name: 'Try now' }).click();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(assign).toHaveBeenCalledWith(WANTED);
  });
});
