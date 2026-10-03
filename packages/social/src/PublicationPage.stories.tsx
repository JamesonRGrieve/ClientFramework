// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { PublicationPage } from './PublicationPage';
import { socialHandlers } from './social.mocks';

const meta: Meta<typeof PublicationPage> = {
  title: 'social/PublicationPage',
  component: PublicationPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: socialHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof PublicationPage>;

export const WithMedia: Story = { args: { params: { publicationId: 'p2' } } };

export const NotVisible: Story = { args: { params: { publicationId: 'gone' } } };
