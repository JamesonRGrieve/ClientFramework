// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { RecordsHeader } from './RecordsHeader';

const meta: Meta<typeof RecordsHeader> = {
  title: 'ecommerce/RecordsHeader',
  component: RecordsHeader,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered' },
  args: { title: 'Orders' },
};
export default meta;

type Story = StoryObj<typeof RecordsHeader>;

export const Orders: Story = {};
