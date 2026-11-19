// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation.js';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette, destinationsOf } from './CommandPalette';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { NavItemDefinition } from '@/lib/zephyrex/types';
import { TestWrapper } from '@/testing/TestWrapper';

const NAV: NavItemDefinition[] = [
  { title: 'Polycule', url: '/polycule', group: 'People' },
  { title: 'People', url: '/genealogy', group: 'People' },
  { title: 'Nights rota', url: '/rota', group: 'Time together' },
  { title: 'Settings', url: '/settings', children: [{ title: 'Profile', url: '/settings/profile' }] },
];

const renderPalette = (navItems: NavItemDefinition[]): ReturnType<typeof render> =>
  render(
    <TestWrapper config={{ navItems }}>
      <SidebarProvider>
        <CommandPalette />
      </SidebarProvider>
    </TestWrapper>,
  );

describe('destinationsOf', () => {
  it('lists every page and child under the heading it sits under in the sidebar', () => {
    expect(destinationsOf(NAV).map(({ title, group }) => `${group}: ${title}`)).toEqual([
      'People: Polycule',
      'People: People',
      'Time together: Nights rota',
      'Time together: Settings',
      'Time together: Settings: Profile',
    ]);
  });
});

describe('CommandPalette', () => {
  it('shows nothing when the sidebar lists no pages', () => {
    renderPalette([]);
    expect(screen.queryByRole('button', { name: /Search/ })).toBeNull();
  });

  it('opens from Ctrl+K, finds a page by name and goes there', async () => {
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ ...vi.mocked(useRouter)(), push });
    const user = userEvent.setup();
    renderPalette(NAV);
    await user.keyboard('{Control>}k{/Control}');
    const search = await screen.findByPlaceholderText('Go to a page…');
    await user.type(search, 'rota');
    await user.click(screen.getByRole('option', { name: /Nights rota/ }));
    expect(push).toHaveBeenCalledWith('/rota');
  });

  it('opens from the sidebar search row too', async () => {
    const user = userEvent.setup();
    renderPalette(NAV);
    await user.click(screen.getByRole('button', { name: /Search/ }));
    expect(await screen.findByPlaceholderText('Go to a page…')).toBeInTheDocument();
  });
});
