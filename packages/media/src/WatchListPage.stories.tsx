// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { ALEX, emptyMediaStore, mediaFixture, mediaHandlers, ME, SAM } from './media.mocks';
import { WatchListPage } from './WatchListPage';

const meta: Meta<typeof WatchListPage> = {
  title: 'media/WatchListPage',
  component: WatchListPage,
  args: {
    people: [
      { userId: ALEX, name: 'Alex' },
      { userId: SAM, name: 'Sam' },
    ],
  },
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: mediaHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof WatchListPage>;

/** The keeper's list: tonight's pick, the titles and who wants them. */
export const YourList: Story = {
  play: async ({ canvasElement }) => {
    const tonight = await within(canvasElement).findByRole('region', { name: 'Tonight' });
    await expect(await within(tonight).findByText('The Matrix (1999)')).toBeInTheDocument();
  },
};

/** A member's view of a list someone else keeps. */
export const SomeoneElsesList: Story = {
  args: { people: [{ userId: ME, name: 'Jo' }] },
  parameters: { msw: { handlers: mediaHandlers({ ...mediaFixture(), me: ALEX }) } },
};

/** No lists yet. */
export const NoLists: Story = {
  parameters: { msw: { handlers: mediaHandlers(emptyMediaStore()) } },
};
