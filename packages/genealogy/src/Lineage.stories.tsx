// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { familyFixture, genealogyHandlers, personOf } from './genealogy.mocks';
import { Lineage } from './Lineage';

const family = familyFixture();

const meta: Meta<typeof Lineage> = {
  title: 'genealogy/Lineage',
  component: Lineage,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: genealogyHandlers() } },
  decorators: [withZephyrexApi],
  args: { people: family.persons },
};
export default meta;

type Story = StoryObj<typeof Lineage>;

export const Ancestors: Story = { args: { person: personOf(family, 'byron-jr') } };

export const NoRecordedAncestors: Story = { args: { person: personOf(family, 'byron') } };
