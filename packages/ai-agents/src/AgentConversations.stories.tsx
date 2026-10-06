// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { AgentConversations } from './AgentConversations';
import { AGENT_ID, agentHandlers, agentsFixture } from './agents.mocks';

const meta: Meta<typeof AgentConversations> = {
  title: 'ai-agents/AgentConversations',
  component: AgentConversations,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
  args: { agentId: AGENT_ID },
};
export default meta;

type Story = StoryObj<typeof AgentConversations>;

export const InOne: Story = {};

export const InNone: Story = { parameters: { msw: { handlers: agentHandlers({ ...agentsFixture(), seats: [] }) } } };
