// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { FOOTER } from './marketing.mocks';
import { SiteFooter } from './SiteFooter';

const meta: Meta<typeof SiteFooter> = {
  title: 'marketing/SiteFooter',
  component: SiteFooter,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  args: { columns: FOOTER, note: "An app's own closing line." },
};
export default meta;
type Story = StoryObj<typeof SiteFooter>;

export const WithNote: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('navigation', { name: 'Footer' })).toBeInTheDocument();
  },
};
