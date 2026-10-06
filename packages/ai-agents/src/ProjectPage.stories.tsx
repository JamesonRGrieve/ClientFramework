// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { agentHandlers, PROJECT_ID } from './agents.mocks';
import { ProjectPage } from './ProjectPage';

const meta: Meta<typeof ProjectPage> = {
  title: 'ai-agents/ProjectPage',
  component: ProjectPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ProjectPage>;

export const Engine: Story = { args: { params: { projectId: PROJECT_ID } } };

export const NotFound: Story = { args: { params: { projectId: 'gone' } } };
