// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { CHAIN_ID, chainHandlers, chainsFixture } from './chains.mocks';
import { ChainSteps } from './ChainSteps';

const meta: Meta<typeof ChainSteps> = {
  title: 'ai-chains/ChainSteps',
  component: ChainSteps,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: chainHandlers() } },
  decorators: [withZephyrexApi],
  args: { chainId: CHAIN_ID },
};
export default meta;

type Story = StoryObj<typeof ChainSteps>;

export const FourSteps: Story = {};

export const NoSteps: Story = { parameters: { msw: { handlers: chainHandlers({ ...chainsFixture(), steps: [] }) } } };
