// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { conversationHandlers } from './conversations.mocks';
import { ConversationPage } from './ConversationPage';

const meta: Meta<typeof ConversationPage> = {
  title: 'conversations/ConversationPage',
  component: ConversationPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: conversationHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ConversationPage>;

export const GroupChat: Story = { args: { params: { conversationId: 'plans' } } };

export const DirectMessage: Story = { args: { params: { conversationId: 'dm-charles' } } };

export const NotIn: Story = { args: { params: { conversationId: 'elsewhere' } } };
