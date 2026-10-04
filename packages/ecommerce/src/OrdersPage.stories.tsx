// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { ecommerceHandlers } from './ecommerce.mocks';
import { OrdersPage } from './OrdersPage';

const meta: Meta<typeof OrdersPage> = {
  title: 'ecommerce/OrdersPage',
  component: OrdersPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: ecommerceHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof OrdersPage>;

export const TwoOrders: Story = {};

export const NoOrders: Story = {
  parameters: { msw: { handlers: ecommerceHandlers({ orders: [], products: [], returns: [] }) } },
};
