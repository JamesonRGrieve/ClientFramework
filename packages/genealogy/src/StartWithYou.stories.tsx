// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { withZephyrexApi } from 'zephyrex/testing';
import { genealogyHandlers } from './genealogy.mocks';
import { StartWithYou } from './StartWithYou';

const meta: Meta<typeof StartWithYou> = {
  title: 'genealogy/StartWithYou',
  component: StartWithYou,
  parameters: { layout: 'padded', msw: { handlers: genealogyHandlers({ persons: [], relationships: [] }) } },
  decorators: [withZephyrexApi],
  args: { onStarted: fn(() => Promise.resolve()) },
};
export default meta;

type Story = StoryObj<typeof StartWithYou>;

/** The polycule map's first run. */
export const OnTheMap: Story = {};

/** The People list's first run. */
export const OnPeople: Story = {
  args: {
    heading: 'Start with you',
    description: 'Nobody is recorded yet. Add yourself first, then the people in your life.',
  },
};
