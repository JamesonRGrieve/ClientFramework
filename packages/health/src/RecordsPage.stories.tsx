// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { healthHandlers } from './health.mocks';
import { RecordsPage } from './RecordsPage';

const meta: Meta<typeof RecordsPage> = {
  title: 'health/RecordsPage',
  component: RecordsPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: healthHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof RecordsPage>;

export const Meals: Story = { args: { params: { kind: 'meal' } } };

export const Sleep: Story = { args: { params: { kind: 'sleep' } } };

export const NoSuchLog: Story = { args: { params: { kind: 'mood' } } };
