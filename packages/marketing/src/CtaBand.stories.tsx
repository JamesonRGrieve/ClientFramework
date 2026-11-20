// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { CtaBand } from './CtaBand';
import { CTA } from './marketing.mocks';

const meta: Meta<typeof CtaBand> = {
  title: 'marketing/CtaBand',
  component: CtaBand,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  args: { title: 'Ready to play?', body: 'Free, no account.', action: CTA },
};
export default meta;
type Story = StoryObj<typeof CtaBand>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Get started' })).toBeInTheDocument();
  },
};
