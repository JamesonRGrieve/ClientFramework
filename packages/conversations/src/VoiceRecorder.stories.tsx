// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { conversationHandlers, PLANS_ID } from './conversations.mocks';
import { VoiceRecorder } from './VoiceRecorder';

const meta: Meta<typeof VoiceRecorder> = {
  title: 'conversations/VoiceRecorder',
  component: VoiceRecorder,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: conversationHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof VoiceRecorder>;

export const Ready: Story = {
  args: { conversationId: PLANS_ID, parentId: null, onSent: async () => Promise.resolve() },
};
