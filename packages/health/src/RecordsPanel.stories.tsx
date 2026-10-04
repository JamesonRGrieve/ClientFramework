// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { healthHandlers } from './health.mocks';
import { RecordsPanel } from './RecordsPanel';
import { activityType } from './recordTypes';

const meta: Meta = {
  title: 'health/RecordsPanel',
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: healthHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj;

export const Activities: Story = { render: () => <RecordsPanel type={activityType} /> };
