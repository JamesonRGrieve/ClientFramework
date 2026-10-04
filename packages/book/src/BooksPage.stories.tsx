// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { bookHandlers } from './book.mocks';
import { BooksPage } from './BooksPage';

const meta: Meta<typeof BooksPage> = {
  title: 'book/BooksPage',
  component: BooksPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: bookHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof BooksPage>;

export const TwoBooks: Story = {};

export const NoBooks: Story = { parameters: { msw: { handlers: bookHandlers({ books: [], chapters: [] }) } } };
