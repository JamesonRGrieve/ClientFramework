// SPDX-License-Identifier: AGPL-3.0-or-later
import { fireEvent, render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NavMain } from './NavMain';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TestWrapper } from '@/testing/TestWrapper';
import type { NavItemDefinition } from '@/lib/zephyrex/types';
import { fetchFrom } from '@/testing/msw';

const HTTP_UNAUTHORIZED = 401;

const renderNav = (navItems: NavItemDefinition[]): ReturnType<typeof render> =>
  render(
    <TestWrapper config={{ navItems }}>
      <SidebarProvider>
        <NavMain />
      </SidebarProvider>
    </TestWrapper>,
  );

describe('NavMain', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows only the entries the app declares, with none of its own', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{}', { status: HTTP_UNAUTHORIZED }))),
    );
    renderNav([{ title: 'Reports', url: '/reports' }]);
    expect(screen.getByText('Reports')).toBeInTheDocument();
    for (const absent of ['Connections', 'Team Management', 'Getting Started', 'Support']) {
      expect(screen.queryByText(absent)).not.toBeInTheDocument();
    }
  });

  it('makes an entry without children a link, and one with children a button that opens them', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{}', { status: HTTP_UNAUTHORIZED }))),
    );
    renderNav([
      { title: 'Reports', url: '/reports' },
      { title: 'Settings', url: '/settings', children: [{ title: 'Billing', url: '/settings/billing' }] },
    ]);
    expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('href', '/reports');
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('shows the sub-entries an entry computes, after its own, and follows them as they change', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{}', { status: HTTP_UNAUTHORIZED }))),
    );
    const latest = { campaigns: [{ title: 'The Koronus Run', url: '/campaign/k1' }] };
    const useLatestCampaigns = (): readonly { title: string; url: string }[] => latest.campaigns;
    const view = renderNav([{ title: 'Campaigns', url: '/campaigns', useChildren: useLatestCampaigns }]);
    // Once it has children it opens like any parent entry.
    fireEvent.click(await screen.findByRole('button', { name: 'Campaigns' }));
    expect(await screen.findByRole('link', { name: 'The Koronus Run' })).toHaveAttribute('href', '/campaign/k1');
    latest.campaigns = [{ title: 'Ashes of Solenne', url: '/campaign/s2' }, ...latest.campaigns];
    view.rerender(
      <TestWrapper config={{ navItems: [{ title: 'Campaigns', url: '/campaigns', useChildren: useLatestCampaigns }] }}>
        <SidebarProvider>
          <NavMain />
        </SidebarProvider>
      </TestWrapper>,
    );
    expect(await screen.findByRole('link', { name: 'Ashes of Solenne' })).toBeInTheDocument();
  });

  it('counts unread notifications beside the inbox link, and shows nothing when all are read', async () => {
    const now = '2026-11-17T00:00:00Z';
    const notes = ['n1', 'n2', 'n3'].map((id) => ({ id, title: id, content: '', reference_type: null, reference_id: null, created_at: now }));
    const serve = (read: boolean[]): void => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          fetchFrom([
            http.get('*/v1/notifications', () => HttpResponse.json({ notifications: notes })),
            http.get('*/v1/user-notifications', () =>
              HttpResponse.json({
                user_notifications: notes.map((note, at) => ({ id: `d${note.id}`, notification_id: note.id, read: read[at], acknowledged: false })),
              }),
            ),
          ]),
        ),
      );
    };
    serve([false, false, true]);
    const view = renderNav([{ title: 'Notifications', url: '/notifications' }, { title: 'Reports', url: '/reports' }]);
    expect(await view.findByText('2')).toBeInTheDocument();
    expect(view.getByText('unread')).toHaveClass('sr-only');
    view.unmount();
    vi.unstubAllGlobals();
    serve([true, true, true]);
    const quiet = renderNav([{ title: 'Notifications', url: '/notifications' }]);
    // Wait until the inbox has actually been fetched, so "nothing shown" is the answer, not the wait.
    await vi.waitFor(() => {
      const urls = vi.mocked(fetch).mock.calls.map(([input]) => String(input instanceof Request ? input.url : input));
      expect(urls.some((url) => url.includes('/v1/user-notifications'))).toBe(true);
    });
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(quiet.queryByText('unread')).not.toBeInTheDocument();
  });
});
