// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Appearances, Themes } from './UserMenu';

function UserMenuDemo() {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <Themes />
        <Appearances />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const meta: Meta<typeof UserMenuDemo> = {
  title: 'AppWrapper/UserMenu',
  component: UserMenuDemo,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof UserMenuDemo>;

export const ThemesAndAppearances: Story = {};
