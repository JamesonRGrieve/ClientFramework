// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { genealogyHandlers } from './genealogy.mocks';
import { PeopleList } from './PeopleList';

const meta: Meta<typeof PeopleList> = {
  title: 'genealogy/PeopleList',
  component: PeopleList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof PeopleList>;

export const Family: Story = { parameters: { msw: { handlers: genealogyHandlers() } } };

export const Empty: Story = { parameters: { msw: { handlers: genealogyHandlers({ persons: [], relationships: [] }) } } };
