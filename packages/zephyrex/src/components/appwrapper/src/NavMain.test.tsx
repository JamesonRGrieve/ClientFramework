// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NavMain } from './NavMain';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TestWrapper } from '@/testing/TestWrapper';
import type { NavItemDefinition } from '@/lib/zephyrex/types';

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
});
