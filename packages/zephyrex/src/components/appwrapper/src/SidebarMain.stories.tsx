// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Server, Users } from 'lucide-react';
import { SidebarMain } from './SidebarMain';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ZephyrexProvider } from '@/lib/zephyrex/ZephyrexProvider';

const meta: Meta<typeof SidebarMain> = {
  title: 'AppWrapper/SidebarMain',
  component: SidebarMain,
  // The sidebar hides on the landing page and the sign-in pages, so show it on an app page.
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true, navigation: { pathname: '/team' } } },
  decorators: [
    (Story) => (
      <ZephyrexProvider
        config={{
          server: { baseUrl: 'http://localhost:1996' },
          app: { name: 'Storybook' },
          navItems: [
            { title: 'Providers', url: '/provider', icon: Server },
            { title: 'Team', url: '/team', icon: Users },
          ],
        }}
      >
        <SidebarProvider>
          <Story />
        </SidebarProvider>
      </ZephyrexProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SidebarMain>;

export const Default: Story = {};
