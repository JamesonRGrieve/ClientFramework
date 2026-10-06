// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { AGENT_ID, agentHandlers } from './agents.mocks';
import { TakeTurn } from './TakeTurn';

const meta: Meta<typeof TakeTurn> = {
  title: 'ai-agents/TakeTurn',
  component: TakeTurn,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof TakeTurn>;

export const Scribe: Story = { args: { agentId: AGENT_ID } };
