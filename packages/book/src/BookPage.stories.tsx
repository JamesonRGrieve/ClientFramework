// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { bookHandlers } from './book.mocks';
import { BookPage } from './BookPage';

const meta: Meta<typeof BookPage> = {
  title: 'book/BookPage',
  component: BookPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: bookHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof BookPage>;

export const WithChapters: Story = { args: { params: { bookId: 'notes' } } };

export const NoChapters: Story = { args: { params: { bookId: 'letters' } } };

export const NotFound: Story = { args: { params: { bookId: 'gone' } } };
