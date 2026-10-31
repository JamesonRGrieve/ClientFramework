// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { expect, within } from 'storybook/test';
import { type Entitlement, ENTITLEMENT_PATH } from '../useEntitlement';
import { withZephyrexApi } from '../../../testing/storyRoot';
import { RequireFeature } from './RequireFeature';

const plan = (features: string[]): Entitlement => ({
  plan: features.length > 1 ? 'plus' : 'basic',
  features,
  limits: { people: 10 },
  seats: 0,
  seats_given: 0,
  via_seat_from: null,
});

const serving = (entitlement: Entitlement) => ({
  msw: { handlers: [http.get(`*${ENTITLEMENT_PATH}`, () => HttpResponse.json(entitlement))] },
});

const meta: Meta<typeof RequireFeature> = {
  title: 'zephyrex/RequireFeature',
  component: RequireFeature,
  tags: ['autodocs'],
  decorators: [withZephyrexApi],
  args: {
    feature: 'calendar_sync',
    title: 'Calendar sync',
    children: <p>Your calendars, side by side.</p>,
  },
};
export default meta;

type Story = StoryObj<typeof RequireFeature>;

export const Unlocked: Story = {
  parameters: serving(plan(['map', 'calendar_sync'])),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText('Your calendars, side by side.')).toBeInTheDocument();
  },
};

export const UpgradeNeeded: Story = {
  parameters: serving(plan(['map'])),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('link', { name: 'See plans' })).toHaveAttribute('href', '/user/subscribe');
  },
};
