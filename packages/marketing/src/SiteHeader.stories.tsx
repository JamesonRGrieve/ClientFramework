// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { CTA, NAV } from './marketing.mocks';
import { SiteHeader } from './SiteHeader';

const meta: Meta<typeof SiteHeader> = {
  title: 'marketing/SiteHeader',
  component: SiteHeader,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  args: { brand: <span>Zephyrex RPG AI</span>, nav: NAV, cta: CTA },
};
export default meta;
type Story = StoryObj<typeof SiteHeader>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Zephyrex RPG AI' })).toBeInTheDocument();
  },
};
