// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { FaqList } from './FaqList';
import { FAQS } from './marketing.mocks';

const meta: Meta<typeof FaqList> = {
  title: 'marketing/FaqList',
  component: FaqList,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  args: { faqs: FAQS },
};
export default meta;
type Story = StoryObj<typeof FaqList>;

export const Questions: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Where is my data?')).toBeInTheDocument();
  },
};
