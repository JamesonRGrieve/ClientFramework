// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { CHAIN_ID, chainHandlers, chainsFixture } from './chains.mocks';
import { ChainRuns } from './ChainRuns';

const meta: Meta<typeof ChainRuns> = {
  title: 'ai-chains/ChainRuns',
  component: ChainRuns,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: chainHandlers() } },
  decorators: [withZephyrexApi],
  args: { chainId: CHAIN_ID },
};
export default meta;

type Story = StoryObj<typeof ChainRuns>;

export const ThreeRuns: Story = {};

export const NoRuns: Story = { parameters: { msw: { handlers: chainHandlers({ ...chainsFixture(), runs: [] }) } } };
