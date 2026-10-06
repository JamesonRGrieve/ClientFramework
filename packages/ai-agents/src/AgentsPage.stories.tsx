// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { agentHandlers, agentsFixture } from './agents.mocks';
import { AgentsPage } from './AgentsPage';

const meta: Meta<typeof AgentsPage> = {
  title: 'ai-agents/AgentsPage',
  component: AgentsPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof AgentsPage>;

export const TwoAgents: Story = {};

export const NoAgents: Story = { parameters: { msw: { handlers: agentHandlers({ ...agentsFixture(), agents: [] }) } } };
