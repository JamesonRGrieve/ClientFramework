// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { familyFixture, genealogyHandlers, personOf } from './genealogy.mocks';
import { Relatives } from './Relatives';

const family = familyFixture();

const meta: Meta<typeof Relatives> = {
  title: 'genealogy/Relatives',
  component: Relatives,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: genealogyHandlers() } },
  decorators: [withZephyrexApi],
  args: { people: family.persons },
};
export default meta;

type Story = StoryObj<typeof Relatives>;

export const ParentsPartnerAndChildren: Story = { args: { person: personOf(family, 'ada') } };

export const OnlyAChild: Story = { args: { person: personOf(family, 'byron') } };
