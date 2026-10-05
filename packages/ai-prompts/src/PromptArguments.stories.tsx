// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { rowOf } from 'zephyrex/testing/msw';
import { PromptArguments } from './PromptArguments';
import { GREETING_ID, promptHandlers, promptsFixture, SUMMARY_ID } from './prompts.mocks';

const { prompts } = promptsFixture();

const meta: Meta<typeof PromptArguments> = {
  title: 'ai-prompts/PromptArguments',
  component: PromptArguments,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: promptHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof PromptArguments>;

export const SomeMissing: Story = { args: { prompt: rowOf(prompts, SUMMARY_ID) } };

export const NoArguments: Story = { args: { prompt: rowOf(prompts, GREETING_ID) } };
