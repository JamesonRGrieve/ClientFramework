// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { AGENT_ID, agentHandlers, agentsFixture } from './agents.mocks';
import { Turns } from './Turns';

const meta: Meta<typeof Turns> = {
  title: 'ai-agents/Turns',
  component: Turns,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
  args: { agentId: AGENT_ID },
};
export default meta;

type Story = StoryObj<typeof Turns>;

export const TwoTurns: Story = {};

export const NoTurns: Story = { parameters: { msw: { handlers: agentHandlers({ ...agentsFixture(), turns: [] }) } } };
