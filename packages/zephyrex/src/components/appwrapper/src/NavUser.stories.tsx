// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { NavUser } from './NavUser';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ZephyrexProvider } from '@/lib/zephyrex/ZephyrexProvider';

const meta: Meta<typeof NavUser> = {
  title: 'AppWrapper/NavUser',
  component: NavUser,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <ZephyrexProvider config={{ server: { baseUrl: 'http://localhost:1996' }, app: { name: 'Storybook' } }}>
        <SidebarProvider>
          <Story />
        </SidebarProvider>
      </ZephyrexProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NavUser>;

/** With no API to answer, the footer offers to sign in. */
export const SignedOut: Story = {};
