// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { genealogyHandlers } from './genealogy.mocks';
import { KinshipLookup } from './KinshipLookup';

const meta: Meta<typeof KinshipLookup> = {
  title: 'genealogy/KinshipLookup',
  component: KinshipLookup,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: genealogyHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof KinshipLookup>;

export const ChooseTwo: Story = {};

export const FromAPersonsPage: Story = { args: { initialPersonId: 'byron-jr' } };
