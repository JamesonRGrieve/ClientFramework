// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { rowOf } from 'zephyrex/testing/msw';
import { PromptEditor } from './PromptEditor';
import { promptHandlers, promptsFixture, SUMMARY_ID } from './prompts.mocks';

const meta: Meta<typeof PromptEditor> = {
  title: 'ai-prompts/PromptEditor',
  component: PromptEditor,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: promptHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof PromptEditor>;

export const Summary: Story = { args: { prompt: rowOf(promptsFixture().prompts, SUMMARY_ID) } };
