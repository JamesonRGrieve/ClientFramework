// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { ToggleSidebar } from './ToggleSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const meta: Meta<typeof ToggleSidebar> = {
  title: 'AppWrapper/ToggleSidebar',
  component: ToggleSidebar,
  decorators: [
    (Story) => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ToggleSidebar>;

export const Left: Story = { args: { side: 'left' } };

export const Right: Story = { args: { side: 'right' } };
