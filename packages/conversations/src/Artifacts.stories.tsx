// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { Artifacts } from './Artifacts';
import { conversationHandlers, emptyStore, PLANS_ID } from './conversations.mocks';

const meta: Meta<typeof Artifacts> = {
  title: 'conversations/Artifacts',
  component: Artifacts,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: conversationHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof Artifacts>;

export const TwoFiles: Story = { args: { conversationId: PLANS_ID } };

export const NoFiles: Story = {
  args: { conversationId: PLANS_ID },
  parameters: { msw: { handlers: conversationHandlers(emptyStore()) } },
};
