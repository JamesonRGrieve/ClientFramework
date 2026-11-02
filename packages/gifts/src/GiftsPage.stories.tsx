// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { withSignedIn, withZephyrexApi } from 'zephyrex/testing';
import { emptyGiftsStore, giftsHandlers } from './gifts.mocks';
import { GiftsPage } from './GiftsPage';

const meta: Meta<typeof GiftsPage> = {
  title: 'gifts/GiftsPage',
  component: GiftsPage,
  args: {
    people: [
      { ref: 'p-alex', name: 'Alex' },
      { ref: 'p-sam', name: 'Sam' },
    ],
    ideas: [
      { forRef: 'p-alex', forName: 'Alex', title: 'Peonies', note: 'Their favourite flower' },
      { forRef: 'p-sam', forName: 'Sam', title: 'A ring, size 7', note: 'Their ring size' },
    ],
  },
  parameters: { nextjs: { appDirectory: true }, layout: 'padded', msw: { handlers: giftsHandlers() } },
  decorators: [withSignedIn, withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof GiftsPage>;

/** Ideas from the app, and a list in progress. */
export const InUse: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('region', { name: 'For Alex' })).toHaveTextContent('A silk scarf');
  },
};

/** Nothing yet, and no ideas. */
export const Empty: Story = {
  args: { ideas: [] },
  parameters: { msw: { handlers: giftsHandlers(emptyGiftsStore()) } },
};
