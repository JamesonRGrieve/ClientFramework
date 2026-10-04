// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { bookHandlers } from './book.mocks';
import { Chapters } from './Chapters';

const meta: Meta<typeof Chapters> = {
  title: 'book/Chapters',
  component: Chapters,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: bookHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof Chapters>;

export const ThreeChapters: Story = { args: { bookId: 'notes' } };

export const NoChapters: Story = { args: { bookId: 'letters' } };
