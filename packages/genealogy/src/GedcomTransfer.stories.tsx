// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { GedcomTransfer } from './GedcomTransfer';
import { genealogyHandlers } from './genealogy.mocks';

const meta: Meta<typeof GedcomTransfer> = {
  title: 'genealogy/GedcomTransfer',
  component: GedcomTransfer,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: genealogyHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof GedcomTransfer>;

export const Default: Story = {};
