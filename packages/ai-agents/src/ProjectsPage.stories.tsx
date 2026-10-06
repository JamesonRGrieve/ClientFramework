// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { agentHandlers, agentsFixture } from './agents.mocks';
import { ProjectsPage } from './ProjectsPage';

const meta: Meta<typeof ProjectsPage> = {
  title: 'ai-agents/ProjectsPage',
  component: ProjectsPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ProjectsPage>;

export const Nested: Story = {};

export const NoProjects: Story = { parameters: { msw: { handlers: agentHandlers({ ...agentsFixture(), projects: [] }) } } };
