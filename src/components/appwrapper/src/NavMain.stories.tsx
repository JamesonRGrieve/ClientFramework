// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { NavMain } from './NavMain';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ZephyrexProvider } from '@/lib/zephyrex/ZephyrexProvider';
import type { ZephyrexConfig } from '@/lib/zephyrex/types';

const config = (navItems: ZephyrexConfig['navItems']): ZephyrexConfig => ({
  server: { baseUrl: 'http://localhost:1996' },
  app: { name: 'Storybook' },
  ...(navItems === undefined ? {} : { navItems }),
});

const meta: Meta<typeof NavMain> = {
  title: 'AppWrapper/NavMain',
  component: NavMain,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof NavMain>;

/** Nothing declared: the framework adds no entries of its own. */
export const NothingDeclared: Story = {
  decorators: [
    (Story) => (
      <ZephyrexProvider config={config(undefined)}>
        <SidebarProvider>
          <Story />
        </SidebarProvider>
      </ZephyrexProvider>
    ),
  ],
};

/** The entries the app's config and its extensions declare. */
export const WithExtensionItems: Story = {
  decorators: [
    (Story) => (
      <ZephyrexProvider
        config={config([
          { title: 'Analytics', url: '/analytics' },
          { title: 'Reports', url: '/reports', children: [{ title: 'Weekly', url: '/reports/weekly' }] },
        ])}
      >
        <SidebarProvider>
          <Story />
        </SidebarProvider>
      </ZephyrexProvider>
    ),
  ],
};
