// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { mapsFixture, mapsHandlers } from './maps.mocks';
import { MeetInTheMiddle } from './MeetInTheMiddle';

const ALEX = 'Alex’s place';
const SAM = 'Sam’s place';
const PICK = 'Add someone’s place';
const meta: Meta<typeof MeetInTheMiddle> = {
  title: 'maps/MeetInTheMiddle',
  component: MeetInTheMiddle,
  args: {
    known: [
      { label: ALEX, location: '53.5461,-113.4938' },
      { label: SAM, location: '51.0447,-114.0719' },
    ],
  },
  parameters: { nextjs: { appDirectory: true }, layout: 'padded', msw: { handlers: mapsHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof MeetInTheMiddle>;

/** Nothing picked yet. */
export const Empty: Story = {};

/** Two homes picked: the middle, the ways there and restaurants nearby. */
export const Found: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByLabelText(PICK), ALEX);
    await userEvent.selectOptions(canvas.getByLabelText(PICK), SAM);
    await userEvent.click(canvas.getByRole('button', { name: 'Find the middle' }));
    await expect(await canvas.findByRole('list', { name: 'Places to meet' })).toHaveTextContent('The Halfway House');
  },
};

/** No route reaches the middle (a lake, a sea). */
export const NoRoute: Story = {
  parameters: { msw: { handlers: mapsHandlers({ ...mapsFixture(), routed: false }) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByLabelText(PICK), ALEX);
    await userEvent.selectOptions(canvas.getByLabelText(PICK), SAM);
    await userEvent.click(canvas.getByRole('button', { name: 'Find the middle' }));
    await expect(await canvas.findByRole('list', { name: 'Getting there' })).toHaveTextContent('No route found');
  },
};

/** Typed places only, as the extension's own page mounts it. */
export const TypedOnly: Story = { args: { known: [] } };
