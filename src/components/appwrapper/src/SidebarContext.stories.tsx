// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { SidebarContent, SidebarContentProvider } from './SidebarContentManager';
import { SidebarContext } from './SidebarContext';
import { SidebarProvider } from '@/components/ui/sidebar';

const meta: Meta<typeof SidebarContext> = {
  title: 'AppWrapper/SidebarContext',
  component: SidebarContext,
  // The context sidebar shows only on the paths it is visible on.
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true, navigation: { pathname: '/team' } } },
  decorators: [
    (Story) => (
      <SidebarContentProvider>
        <SidebarProvider>
          <Story />
        </SidebarProvider>
      </SidebarContentProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SidebarContext>;

/** A page puts its own content and title in the context sidebar. */
export const WithPageContent: Story = {
  render: (args) => (
    <>
      <SidebarContent title='Team details'>
        <p className='p-2 text-sm'>Members and roles for the selected team.</p>
      </SidebarContent>
      <SidebarContext {...args} />
    </>
  ),
};
