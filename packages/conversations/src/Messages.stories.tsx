// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { conversationHandlers, ME } from './conversations.mocks';
import { Messages } from './Messages';

const meta: Meta<typeof Messages> = {
  title: 'conversations/Messages',
  component: Messages,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: conversationHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof Messages>;

export const AsOwner: Story = { args: { conversationId: 'plans', viewerId: ME.id, ownerView: true } };

export const AsParticipant: Story = { args: { conversationId: 'dm-charles', viewerId: ME.id, ownerView: false } };
