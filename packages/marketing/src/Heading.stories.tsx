// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { Heading } from './Heading';

const meta: Meta<typeof Heading> = {
  title: 'marketing/Heading',
  component: Heading,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  args: { level: 2, children: 'A section' },
};
export default meta;
type Story = StoryObj<typeof Heading>;

/** The caller picks the level, so the outline stays unbroken. */
export const Level2: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { level: 2, name: 'A section' })).toBeInTheDocument();
  },
};
