// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { conversationHandlers } from './conversations.mocks';
import { ConversationsPage } from './ConversationsPage';

const meta: Meta<typeof ConversationsPage> = {
  title: 'conversations/ConversationsPage',
  component: ConversationsPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: conversationHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ConversationsPage>;

export const TwoConversations: Story = {};

export const NoConversations: Story = {
  parameters: { msw: { handlers: conversationHandlers({ conversations: [], participants: [], messages: [] }) } },
};
