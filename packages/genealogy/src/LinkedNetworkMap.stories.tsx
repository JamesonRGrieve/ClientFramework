// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { withZephyrexApi } from 'zephyrex/testing';
import { genealogyHandlers, threePolyculesFixture } from './genealogy.mocks';
import { LinkedNetworkMap } from './LinkedNetworkMap';

const meta: Meta<typeof LinkedNetworkMap> = {
  title: 'genealogy/LinkedNetworkMap',
  component: LinkedNetworkMap,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: genealogyHandlers(threePolyculesFixture()) } },
  decorators: [withZephyrexApi],
  args: {
    title: 'Your polycules',
    description: 'Each polycule you are in branches off you in its own direction.',
    groupLabel: (index: number): string => `Polycule ${String(index + 1)}`,
  },
};
export default meta;

type Story = StoryObj<typeof LinkedNetworkMap>;

export const ThreePolycules: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('region', { name: 'Polycule 3' })).toBeInTheDocument();
  },
};
