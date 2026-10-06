// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { AgentAbilities } from './AgentAbilities';
import { AGENT_ID, agentHandlers } from './agents.mocks';

const meta: Meta<typeof AgentAbilities> = {
  title: 'ai-agents/AgentAbilities',
  component: AgentAbilities,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof AgentAbilities>;

export const OneGranted: Story = { args: { agentId: AGENT_ID } };
