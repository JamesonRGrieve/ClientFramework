// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { emptyPromptStore, promptHandlers } from './prompts.mocks';
import { PromptsPage } from './PromptsPage';

const meta: Meta<typeof PromptsPage> = {
  title: 'ai-prompts/PromptsPage',
  component: PromptsPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: promptHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof PromptsPage>;

export const TwoPrompts: Story = {};

export const NoPrompts: Story = { parameters: { msw: { handlers: promptHandlers(emptyPromptStore()) } } };
