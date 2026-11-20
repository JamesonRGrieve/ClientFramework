// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { PLAN_FREE, PLAN_PRO } from './marketing.mocks';
import { PricingCard } from './PricingCard';

const meta: Meta<typeof PricingCard> = {
  title: 'marketing/PricingCard',
  component: PricingCard,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  decorators: [(Story) => <div className='max-w-xs'>{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof PricingCard>;

export const Plain: Story = {
  args: { plan: PLAN_FREE },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText('Recommended')).not.toBeInTheDocument();
  },
};

export const Highlighted: Story = {
  args: { plan: PLAN_PRO },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Recommended')).toBeInTheDocument();
  },
};
