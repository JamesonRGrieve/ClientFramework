// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { MeetMap } from './MeetMap';

const meta: Meta<typeof MeetMap> = {
  title: 'maps/MeetMap',
  component: MeetMap,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof MeetMap>;

/** Edmonton and Calgary, met near Red Deer, with two places to meet. */
export const TwoStarts: Story = {
  args: {
    midpoint: {
      lat: 52.27,
      lon: -113.81,
      legs: [
        { location: '53.5461,-113.4938', straight_m: 140000 },
        { location: '51.0447,-114.0719', straight_m: 140000 },
      ],
      places: [],
    },
    labels: ['Alex’s place', 'Sam’s place'],
    places: [
      { id: 'a', name: 'The Halfway House', address: '1 Gaetz Ave', lat: 52.268, lon: -113.811 },
      { id: 'b', name: 'Bower Ponds Café', address: '2 Bower Ponds', lat: 52.275, lon: -113.8 },
    ],
  },
};
