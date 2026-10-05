// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { Deliveries } from './Deliveries';
import { emptyWebhookStore, ORDERS_HOOK_ID, webhookHandlers } from './webhooks.mocks';

const meta: Meta<typeof Deliveries> = {
  title: 'webhooks/Deliveries',
  component: Deliveries,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: webhookHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof Deliveries>;

export const SentRetryingAndDead: Story = { args: { subscriptionId: ORDERS_HOOK_ID } };

export const NothingSent: Story = {
  args: { subscriptionId: ORDERS_HOOK_ID },
  parameters: { msw: { handlers: webhookHandlers(emptyWebhookStore()) } },
};
