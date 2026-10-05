// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { SubscriptionPage } from './SubscriptionPage';
import { ORDERS_HOOK_ID, PAUSED_HOOK_ID, webhookHandlers } from './webhooks.mocks';

const meta: Meta<typeof SubscriptionPage> = {
  title: 'webhooks/SubscriptionPage',
  component: SubscriptionPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: webhookHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof SubscriptionPage>;

export const WithDeliveries: Story = { args: { params: { subscriptionId: ORDERS_HOOK_ID } } };

export const Paused: Story = { args: { params: { subscriptionId: PAUSED_HOOK_ID } } };

export const NotFound: Story = { args: { params: { subscriptionId: 'gone' } } };
