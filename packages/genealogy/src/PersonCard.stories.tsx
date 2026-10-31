// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { withZephyrexApi } from 'zephyrex/testing';
import { genealogyHandlers, polyculeFixture } from './genealogy.mocks';
import { type CardSection, PersonCard } from './PersonCard';

const VERSION = '2026-01-01T00:00:00';
const store = polyculeFixture();
store.attributes = [
  { id: 'a1', person_id: 'ben', category: 'contact', label: 'phone', value: '555 0142', created_at: VERSION },
  { id: 'a2', person_id: 'ben', category: 'allergies', label: 'dietary', value: 'peanuts', created_at: VERSION },
  { id: 'a3', person_id: 'ben', category: 'favourites', label: 'flower', value: 'peonies', created_at: VERSION },
];
store.published = { ben: [{ id: 'p1', category: 'sizes', label: 'ring', value: '7', unit: 'US', created_at: VERSION }] };

const SECTIONS: readonly CardSection[] = [
  {
    name: 'contact',
    title: 'Contact',
    fields: [
      { label: 'phone', units: [] },
      { label: 'email', units: [] },
    ],
  },
  {
    name: 'allergies',
    title: 'Allergies',
    fields: [
      { label: 'medical', units: [] },
      { label: 'dietary', units: [] },
    ],
  },
  { name: 'sizes', title: 'Sizes', fields: [{ label: 'ring', units: ['US', 'EU'] }], locked: true, feature: 'card_full' },
  { name: 'favourites', title: 'Favourites', fields: [{ label: 'flower', units: [] }] },
];

const meta: Meta<typeof PersonCard> = {
  title: 'genealogy/PersonCard',
  component: PersonCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: genealogyHandlers(store) } },
  decorators: [withZephyrexApi],
  args: { personId: 'ben', sections: SECTIONS, title: 'Ben’s card' },
};
export default meta;

type Story = StoryObj<typeof PersonCard>;

export const Sections: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('region', { name: 'Allergies' })).toHaveTextContent('peanuts');
    await expect(canvas.getByRole('region', { name: 'Shared with you' })).toHaveTextContent('7 US');
  },
};
