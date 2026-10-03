// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { PublicationsPage } from './PublicationsPage';
import { socialHandlers } from './social.mocks';

const meta: Meta<typeof PublicationsPage> = {
  title: 'social/PublicationsPage',
  component: PublicationsPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: socialHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof PublicationsPage>;

export const ThreePosts: Story = {};

export const NothingPosted: Story = { parameters: { msw: { handlers: socialHandlers([]) } } };
