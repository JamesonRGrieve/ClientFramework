// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { healthHandlers } from './health.mocks';
import { HealthPage } from './HealthPage';

const meta: Meta<typeof HealthPage> = {
  title: 'health/HealthPage',
  component: HealthPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: healthHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof HealthPage>;

export const AWeekLogged: Story = {};

export const NothingLogged: Story = {
  parameters: { msw: { handlers: healthHandlers({ activities: [], meals: [], weights: [], sleeps: [] }) } },
};
