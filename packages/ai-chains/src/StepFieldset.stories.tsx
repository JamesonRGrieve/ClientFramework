// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { chainHandlers } from './chains.mocks';
import { StepFieldset } from './StepFieldset';
import { NEW_STEP } from './stepModel';

const meta: Meta<typeof StepFieldset> = {
  title: 'ai-chains/StepFieldset',
  component: StepFieldset,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: chainHandlers() } },
  decorators: [withZephyrexApi],
  argTypes: { onChange: { action: 'changed' } },
};
export default meta;

type Story = StoryObj<typeof StepFieldset>;

export const PromptStep: Story = {
  args: { draft: { ...NEW_STEP, name: 'summarise', promptId: 'brief', arguments: 'TEXT = found' } },
};

export const ConditionStep: Story = {
  args: {
    draft: { ...NEW_STEP, name: 'check', kind: 'condition', expression: 'len(found) > 0', onFalse: 'end', maxLoops: '3' },
  },
};
