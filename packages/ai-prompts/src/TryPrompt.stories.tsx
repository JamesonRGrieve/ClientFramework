// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { promptHandlers, promptsFixture, rowOf, SUMMARY_ID } from './prompts.mocks';
import { TryPrompt } from './TryPrompt';

const meta: Meta<typeof TryPrompt> = {
  title: 'ai-prompts/TryPrompt',
  component: TryPrompt,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: promptHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof TryPrompt>;

export const Summary: Story = { args: { prompt: rowOf(promptsFixture().prompts, SUMMARY_ID) } };
