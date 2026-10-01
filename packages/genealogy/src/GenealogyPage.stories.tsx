// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { GenealogyPage } from './GenealogyPage';
import { genealogyHandlers } from './genealogy.mocks';

const meta: Meta<typeof GenealogyPage> = {
  title: 'genealogy/GenealogyPage',
  component: GenealogyPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: genealogyHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof GenealogyPage>;

export const Default: Story = {};
