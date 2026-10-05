// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { rowOf } from 'zephyrex/testing/msw';
import { conversationHandlers, conversationsFixture, ME } from './conversations.mocks';
import { Participants } from './Participants';

const { conversations } = conversationsFixture();

const meta: Meta<typeof Participants> = {
  title: 'conversations/Participants',
  component: Participants,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: conversationHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof Participants>;

export const OwnGroupChat: Story = { args: { conversation: rowOf(conversations, 'plans'), viewerId: ME.id } };

export const SomeoneElsesDirect: Story = { args: { conversation: rowOf(conversations, 'dm-charles'), viewerId: ME.id } };
