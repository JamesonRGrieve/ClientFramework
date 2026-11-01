// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { withZephyrexApi } from 'zephyrex/testing';
import { genealogyHandlers, personOf, polyculeFixture } from './genealogy.mocks';
import { SocialCircle } from './SocialCircle';

const polycule = polyculeFixture();

const meta: Meta<typeof SocialCircle> = {
  title: 'genealogy/SocialCircle',
  component: SocialCircle,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: genealogyHandlers(polycule) } },
  decorators: [withZephyrexApi],
  args: { people: polycule.persons },
};
export default meta;

type Story = StoryObj<typeof SocialCircle>;

export const Polycule: Story = { args: { person: personOf(polycule, 'ana') } };

export const ThroughFriendships: Story = {
  args: { person: personOf(polycule, 'ana') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('region', { name: 'Directly connected' });
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Through friendships too' }));
    await expect(await canvas.findByRole('link', { name: 'Fay' })).toBeInTheDocument();
  },
};

export const NoPartners: Story = { args: { person: personOf(polycule, 'eli') } };
