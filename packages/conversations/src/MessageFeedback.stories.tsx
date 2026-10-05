// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { conversationHandlers } from './conversations.mocks';
import { MessageFeedback } from './MessageFeedback';

const meta: Meta<typeof MessageFeedback> = {
  title: 'conversations/MessageFeedback',
  component: MessageFeedback,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: conversationHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof MessageFeedback>;

export const RatedHelpful: Story = { args: { messageId: 'm3' } };

export const NotRated: Story = { args: { messageId: 'm1' } };
