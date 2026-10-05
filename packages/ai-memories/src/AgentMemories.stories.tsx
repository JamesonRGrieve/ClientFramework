// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { AgentMemories } from './AgentMemories';
import { AGENT_ID, emptyMemoryStore, memoryHandlers } from './memories.mocks';

const meta: Meta<typeof AgentMemories> = {
  title: 'ai-memories/AgentMemories',
  component: AgentMemories,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: memoryHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof AgentMemories>;

export const TwoMemories: Story = { args: { agentId: AGENT_ID } };

export const NothingYet: Story = {
  args: { agentId: AGENT_ID },
  parameters: { msw: { handlers: memoryHandlers(emptyMemoryStore()) } },
};
