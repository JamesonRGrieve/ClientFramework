// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { genealogyHandlers } from './genealogy.mocks';
import { PersonPage } from './PersonPage';

const meta: Meta<typeof PersonPage> = {
  title: 'genealogy/PersonPage',
  component: PersonPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: genealogyHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof PersonPage>;

export const Ada: Story = { args: { params: { personId: 'ada' } } };

export const NotInTheTree: Story = { args: { params: { personId: 'nobody' } } };
