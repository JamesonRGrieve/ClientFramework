// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { agentHandlers } from './agents.mocks';
import { RotationPicker } from './RotationPicker';

const meta: Meta<typeof RotationPicker> = {
  title: 'ai-agents/RotationPicker',
  component: RotationPicker,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: agentHandlers() } },
  decorators: [withZephyrexApi],
  argTypes: { onChange: { action: 'chose' } },
};
export default meta;

type Story = StoryObj<typeof RotationPicker>;

export const DefaultModels: Story = { args: { value: null } };

export const FastModels: Story = { args: { value: 'fast' } };
