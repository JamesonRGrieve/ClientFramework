// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { ecommerceHandlers } from './ecommerce.mocks';
import { ReturnsPage } from './ReturnsPage';

const meta: Meta<typeof ReturnsPage> = {
  title: 'ecommerce/ReturnsPage',
  component: ReturnsPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: ecommerceHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ReturnsPage>;

export const OneReturn: Story = {};
