// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { ComparisonTable } from './ComparisonTable';

const meta: Meta<typeof ComparisonTable> = {
  title: 'marketing/ComparisonTable',
  component: ComparisonTable,
  parameters: { layout: 'padded' },
  args: {
    columns: ['Zephyrex RPG', 'SillyTavern'],
    rows: [
      { feature: 'Character cards and lorebooks', values: ['SillyTavern-compatible', 'SillyTavern’s own'] },
      {
        feature: 'Out-of-character table talk',
        values: ['Its own channel, kept out of the story', '(( )) inside the story'],
      },
      { feature: 'Phones and tablets', values: ['Built for touch, installable', 'Usable on a phone, built for desktop'] },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof ComparisonTable>;

export const Desktop: Story = {};

/** At phone width the rows are cards: every value shows in full, under its column's name. */
export const Phone: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
  },
};
