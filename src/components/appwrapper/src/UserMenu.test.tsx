// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Appearances, Themes } from './UserMenu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const openMenu = async (user: ReturnType<typeof userEvent.setup>, submenu: string): Promise<HTMLElement> => {
  await user.click(document.querySelector<HTMLElement>('[data-testid="menu-trigger"]') ?? document.body);
  await user.click(await within(document.body).findByText(submenu));
  return within(document.body).findByRole('menu', { name: submenu });
};

const renderMenu = (): ReturnType<typeof render> =>
  render(
    <DropdownMenu>
      <DropdownMenuTrigger data-testid='menu-trigger'>Menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <Themes />
        <Appearances />
      </DropdownMenuContent>
    </DropdownMenu>,
  );

describe('UserMenu', () => {
  afterEach(() => {
    document.documentElement.className = '';
  });

  it('offers the built-in themes and applies the one chosen', async () => {
    const user = userEvent.setup();
    renderMenu();
    const themes = await openMenu(user, 'Themes');
    expect(within(themes).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'light',
      'dark',
      'colorblind',
      'colorblind-dark',
    ]);
    // Pointer clicks do not reach Radix sub-menu items under jsdom; the keyboard is the real path here.
    within(themes).getByRole('menuitem', { name: 'dark' }).focus();
    await user.keyboard('{Enter}');
    expect(within(document.body).queryByRole('menu')).not.toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('offers the appearances', async () => {
    const user = userEvent.setup();
    renderMenu();
    const appearances = await openMenu(user, 'Appearances');
    expect(within(appearances).getAllByRole('menuitem').length).toBeGreaterThan(0);
  });
});
