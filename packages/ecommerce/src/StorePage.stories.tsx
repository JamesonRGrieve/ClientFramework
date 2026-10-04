// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { ecommerceHandlers } from './ecommerce.mocks';
import { StorePage } from './StorePage';

const meta: Meta<typeof StorePage> = {
  title: 'ecommerce/StorePage',
  component: StorePage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: ecommerceHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof StorePage>;

export const TwoStores: Story = {};
