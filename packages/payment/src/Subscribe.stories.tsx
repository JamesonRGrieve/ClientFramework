// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Subscribe } from './Subscribe';

// Without a pricing table the page says subscribing is not available; with one, Stripe's hosted
// table renders for the query's customer (it needs Stripe's script, so it stays blank offline).
const meta: Meta<typeof Subscribe> = {
  title: 'payment/Subscribe',
  component: Subscribe,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Subscribe>;

export const NotConfigured: Story = {};

export const WithPricingTable: Story = {
  args: { pricingTableId: 'prctbl_example', publishableKey: 'pk_test_example' },
  parameters: { nextjs: { appDirectory: true, navigation: { query: { email: 'subscriber@example.com' } } } },
};
