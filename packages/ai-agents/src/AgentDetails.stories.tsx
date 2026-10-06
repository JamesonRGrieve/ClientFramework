// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { rowOf } from 'zephyrex/testing/msw';
import { AgentDetails } from './AgentDetails';
import { AGENT_ID, agentHandlers, agentsFixture } from './agents.mocks';

const meta: Meta<typeof AgentDetails> = {
  title: 'ai-agents/AgentDetails',
  component: AgentDetails,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof AgentDetails>;

export const Scribe: Story = { args: { agent: rowOf(agentsFixture().agents, AGENT_ID) } };
