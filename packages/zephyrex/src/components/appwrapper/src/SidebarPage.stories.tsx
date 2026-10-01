// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { SidebarPage } from './SidebarPage';
import { SidebarProvider } from '@/components/ui/sidebar';

const meta: Meta<typeof SidebarPage> = {
  title: 'AppWrapper/SidebarPage',
  component: SidebarPage,
  decorators: [
    (Story) => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SidebarPage>;

export const Default: Story = {
  args: { title: 'Providers', children: <p className='p-4'>A page inside the sidebar layout.</p> },
};
