// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { AgentPage } from './AgentPage';
import { AGENT_ID, agentHandlers } from './agents.mocks';

const meta: Meta<typeof AgentPage> = {
  title: 'ai-agents/AgentPage',
  component: AgentPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof AgentPage>;

export const Scribe: Story = { args: { params: { agentId: AGENT_ID } } };

export const NotFound: Story = { args: { params: { agentId: 'gone' } } };
