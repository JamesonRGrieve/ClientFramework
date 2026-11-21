// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { DownPage } from './DownPage';

const meta: Meta<typeof DownPage> = {
  title: 'pages/down/DownPage',
  component: DownPage,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
};
export default meta;

type Story = StoryObj<typeof DownPage>;

/** The server is down: the count runs and the page keeps asking. */
export const Down: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Try now' })).toBeInTheDocument();
  },
};
