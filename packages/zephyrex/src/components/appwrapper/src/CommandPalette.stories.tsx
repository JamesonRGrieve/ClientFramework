// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { CommandPalette } from './CommandPalette';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ZephyrexProvider } from '@/lib/zephyrex/ZephyrexProvider';
import type { ZephyrexConfig } from '@/lib/zephyrex/types';

const config: ZephyrexConfig = {
  server: { baseUrl: 'http://localhost:1996' },
  app: { name: 'Storybook' },
  navItems: [
    { title: 'Polycule', url: '/polycule', group: 'People' },
    { title: 'People', url: '/genealogy', group: 'People' },
    { title: 'Nights rota', url: '/rota', group: 'Time together' },
    { title: 'Gifts', url: '/gifts', group: 'Care' },
  ],
};

const meta: Meta<typeof CommandPalette> = {
  title: 'AppWrapper/CommandPalette',
  component: CommandPalette,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  decorators: [
    (Story) => (
      <ZephyrexProvider config={config}>
        <SidebarProvider>
          <div className='w-64'>
            <Story />
          </div>
        </SidebarProvider>
      </ZephyrexProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CommandPalette>;

/** The sidebar's search row; it, or Ctrl+K, opens a search over every page grouped as the sidebar groups them. */
export const SearchRow: Story = {};

export const Opened: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Search/ }));
    await expect(await within(document.body).findByPlaceholderText('Go to a page…')).toBeInTheDocument();
  },
};
