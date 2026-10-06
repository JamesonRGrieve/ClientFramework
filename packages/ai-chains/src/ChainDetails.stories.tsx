// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { rowOf } from 'zephyrex/testing/msw';
import { ChainDetails } from './ChainDetails';
import { CHAIN_ID, chainHandlers, chainsFixture } from './chains.mocks';

const meta: Meta<typeof ChainDetails> = {
  title: 'ai-chains/ChainDetails',
  component: ChainDetails,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: chainHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ChainDetails>;

export const DailyDigest: Story = { args: { chain: rowOf(chainsFixture().chains, CHAIN_ID) } };
