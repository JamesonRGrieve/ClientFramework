// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { CHAIN_ID, chainHandlers } from './chains.mocks';
import { ChainPage } from './ChainPage';

const meta: Meta<typeof ChainPage> = {
  title: 'ai-chains/ChainPage',
  component: ChainPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: chainHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ChainPage>;

export const DailyDigest: Story = { args: { params: { chainId: CHAIN_ID } } };

export const NotFound: Story = { args: { params: { chainId: 'gone' } } };
