// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { AGENT_ID, agentHandlers, agentsFixture } from './agents.mocks';
import { Triggers } from './Triggers';

const meta: Meta<typeof Triggers> = {
  title: 'ai-agents/Triggers',
  component: Triggers,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
  args: { agentId: AGENT_ID },
};
export default meta;

type Story = StoryObj<typeof Triggers>;

export const ScheduleAndWebhook: Story = {};

export const NoTriggers: Story = { parameters: { msw: { handlers: agentHandlers({ ...agentsFixture(), triggers: [] }) } } };
