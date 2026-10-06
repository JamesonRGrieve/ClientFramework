// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { CHAIN_ID, chainHandlers } from './chains.mocks';
import { RunChain } from './RunChain';

const meta: Meta<typeof RunChain> = {
  title: 'ai-chains/RunChain',
  component: RunChain,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: chainHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof RunChain>;

export const DailyDigest: Story = { args: { chainId: CHAIN_ID } };
