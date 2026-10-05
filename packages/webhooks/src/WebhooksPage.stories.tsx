// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { emptyWebhookStore, webhookHandlers } from './webhooks.mocks';
import { WebhooksPage } from './WebhooksPage';

const meta: Meta<typeof WebhooksPage> = {
  title: 'webhooks/WebhooksPage',
  component: WebhooksPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: webhookHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof WebhooksPage>;

export const TwoSubscriptions: Story = {};

export const NoSubscriptions: Story = {
  parameters: { msw: { handlers: webhookHandlers(emptyWebhookStore()) } },
};
