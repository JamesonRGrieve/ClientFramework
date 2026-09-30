// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { SidebarHeader, SidebarHeaderTitle, SidebarMain } from './SidebarHeader';
import { SidebarProvider } from '@/components/ui/sidebar';

const meta: Meta<typeof SidebarHeader> = {
  title: 'AppWrapper/SidebarHeader',
  component: SidebarHeader,
  decorators: [
    (Story) => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SidebarHeader>;

/** A page header with its title, over the page's main area. */
export const WithTitle: Story = {
  render: () => (
    <div className='w-full'>
      <SidebarHeader>
        <SidebarHeaderTitle>Team</SidebarHeaderTitle>
      </SidebarHeader>
      <SidebarMain className='p-4'>The page’s content.</SidebarMain>
    </div>
  ),
};
