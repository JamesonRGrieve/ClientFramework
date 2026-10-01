// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { DropdownMenu } from './dropdown-menu';

const meta: Meta<typeof DropdownMenu> = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => <DropdownMenu>DropdownMenu content</DropdownMenu>,
};
