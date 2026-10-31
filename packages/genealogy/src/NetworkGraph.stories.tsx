// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { withZephyrexApi } from 'zephyrex/testing';
import type { Network } from './genealogyApi';
import { polyculeFixture } from './genealogy.mocks';
import { NetworkGraph } from './NetworkGraph';
import { fromNetwork } from './socialLayout';

const polycule = polyculeFixture();
const people = new Map(polycule.persons.map((person) => [person.id, person]));

const ring: Network = {
  person_id: 'ana',
  kinds: ['partnership', 'friendship'],
  members: [
    { person_id: 'ben', distance: 1 },
    { person_id: 'cleo', distance: 2 },
    { person_id: 'fay', distance: 2 },
    { person_id: 'dev', distance: 3 },
  ],
  ties: [
    { person_id: 'ana', target_person_id: 'ben', kind: 'partnership', discriminator: 'nesting', directed: false },
    { person_id: 'ben', target_person_id: 'cleo', kind: 'partnership', discriminator: 'dating', directed: false },
    { person_id: 'ben', target_person_id: 'fay', kind: 'friendship', discriminator: 'best_friend', directed: false },
    { person_id: 'cleo', target_person_id: 'dev', kind: 'partnership', discriminator: 'anchor', directed: false },
    { person_id: 'dev', target_person_id: 'fay', kind: 'friendship', discriminator: null, directed: false },
  ],
};

const meta: Meta<typeof NetworkGraph> = {
  title: 'genealogy/NetworkGraph',
  component: NetworkGraph,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [withZephyrexApi],
  args: { graph: fromNetwork(ring, people) },
};
export default meta;

type Story = StoryObj<typeof NetworkGraph>;

export const PolyculeWithFriends: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Dev')).toBeInTheDocument();
    await expect(canvas.getByText('Friends')).toBeInTheDocument();
  },
};

export const Triad: Story = {
  args: {
    graph: fromNetwork(
      {
        person_id: 'ana',
        kinds: ['partnership'],
        members: [
          { person_id: 'ben', distance: 1 },
          { person_id: 'cleo', distance: 1 },
        ],
        ties: [
          { person_id: 'ana', target_person_id: 'ben', kind: 'partnership', discriminator: 'nesting', directed: false },
          { person_id: 'ana', target_person_id: 'cleo', kind: 'partnership', discriminator: 'dating', directed: false },
          { person_id: 'ben', target_person_id: 'cleo', kind: 'partnership', discriminator: 'dating', directed: false },
        ],
      },
      people,
    ),
  },
};
