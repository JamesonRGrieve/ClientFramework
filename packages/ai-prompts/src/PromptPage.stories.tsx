// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { PromptPage } from './PromptPage';
import { GREETING_ID, promptHandlers, SUMMARY_ID } from './prompts.mocks';

const meta: Meta<typeof PromptPage> = {
  title: 'ai-prompts/PromptPage',
  component: PromptPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: promptHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof PromptPage>;

export const WithVariables: Story = { args: { params: { promptId: SUMMARY_ID } } };

export const Plain: Story = { args: { params: { promptId: GREETING_ID } } };

export const NotFound: Story = { args: { params: { promptId: 'gone' } } };
