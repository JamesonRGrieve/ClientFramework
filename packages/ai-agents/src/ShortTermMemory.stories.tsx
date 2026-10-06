// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { AGENT_ID, agentHandlers, agentsFixture } from './agents.mocks';
import { ShortTermMemory } from './ShortTermMemory';

const meta: Meta<typeof ShortTermMemory> = {
  title: 'ai-agents/ShortTermMemory',
  component: ShortTermMemory,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
  args: { agentId: AGENT_ID },
};
export default meta;

type Story = StoryObj<typeof ShortTermMemory>;

export const OneMemory: Story = {};

export const Empty: Story = { parameters: { msw: { handlers: agentHandlers({ ...agentsFixture(), workingMemory: [] }) } } };
