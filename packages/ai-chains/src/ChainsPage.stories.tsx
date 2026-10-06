// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { chainHandlers, chainsFixture } from './chains.mocks';
import { ChainsPage } from './ChainsPage';

const meta: Meta<typeof ChainsPage> = {
  title: 'ai-chains/ChainsPage',
  component: ChainsPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: chainHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ChainsPage>;

export const TwoChains: Story = {};

export const NoChains: Story = { parameters: { msw: { handlers: chainHandlers({ ...chainsFixture(), chains: [] }) } } };
