// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { ecommerceHandlers } from './ecommerce.mocks';
import { ProductsPage } from './ProductsPage';

const meta: Meta<typeof ProductsPage> = {
  title: 'ecommerce/ProductsPage',
  component: ProductsPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: ecommerceHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ProductsPage>;

export const TwoProducts: Story = {};
