// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { AvailabilityPage } from './AvailabilityPage';
import { ALEX, calendarHandlers, emptyCalendarStore, JO, SAM } from './calendar.mocks';

const meta: Meta<typeof AvailabilityPage> = {
  title: 'calendar/AvailabilityPage',
  component: AvailabilityPage,
  args: {
    people: [
      { userId: ALEX, name: 'Alex' },
      { userId: SAM, name: 'Sam' },
      { userId: JO, name: 'Jo' },
    ],
  },
  parameters: { nextjs: { appDirectory: true }, layout: 'padded', msw: { handlers: calendarHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof AvailabilityPage>;

/** A calendar connected, sharing with Alex, and free evenings with Alex found. */
export const FreeEvenings: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('checkbox', { name: 'Alex' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Find free times' }));
    await expect(await canvas.findByRole('list', { name: 'Free times' })).toBeInTheDocument();
  },
};

/** Nothing connected or shared yet. */
export const FirstVisit: Story = {
  parameters: { msw: { handlers: calendarHandlers(emptyCalendarStore()) } },
};
