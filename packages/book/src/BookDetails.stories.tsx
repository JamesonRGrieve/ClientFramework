// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { bookFixture, bookHandlers, bookOf } from './book.mocks';
import { BookDetails } from './BookDetails';

const store = bookFixture();

const meta: Meta<typeof BookDetails> = {
  title: 'book/BookDetails',
  component: BookDetails,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered', msw: { handlers: bookHandlers(store) } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof BookDetails>;

export const Editing: Story = { args: { book: bookOf(store, 'notes') } };

export const NoAuthor: Story = { args: { book: bookOf(store, 'letters') } };
