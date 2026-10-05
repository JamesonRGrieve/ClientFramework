// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { ConversationDetails } from './ConversationDetails';
import { conversationHandlers, conversationsFixture, rowOf } from './conversations.mocks';

const { conversations } = conversationsFixture();

const meta: Meta<typeof ConversationDetails> = {
  title: 'conversations/ConversationDetails',
  component: ConversationDetails,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: conversationHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ConversationDetails>;

export const OwnGroupChat: Story = { args: { conversation: rowOf(conversations, 'plans'), viewerOwns: true } };

export const OthersGroupChat: Story = { args: { conversation: rowOf(conversations, 'plans'), viewerOwns: false } };
