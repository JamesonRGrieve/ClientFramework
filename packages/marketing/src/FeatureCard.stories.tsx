// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { FeatureCard } from './FeatureCard';
import { FEATURE_EVERYWHERE, FEATURE_HOSTED } from './marketing.mocks';

const meta: Meta<typeof FeatureCard> = {
  title: 'marketing/FeatureCard',
  component: FeatureCard,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  decorators: [(Story) => <div className='max-w-md'>{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof FeatureCard>;

export const Everywhere: Story = {
  args: { feature: FEATURE_EVERYWHERE },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText('Hosted service')).not.toBeInTheDocument();
  },
};

export const Hosted: Story = {
  args: { feature: FEATURE_HOSTED },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Hosted service')).toBeInTheDocument();
  },
};
