// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { withZephyrexApi } from 'zephyrex/testing';
import { type Session, Sessions, SESSIONS_ENDPOINT } from './Sessions';

const listing = (sessions: Session[]) => ({
  msw: {
    handlers: [http.get(`*${SESSIONS_ENDPOINT}`, () => HttpResponse.json({ sessions, pagination: { has_more: false } }))],
  },
});

const meta: Meta<typeof Sessions> = {
  title: 'auth-session/Sessions',
  component: Sessions,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof Sessions>;

export const None: Story = { parameters: listing([]) };

export const TwoDevices: Story = {
  parameters: listing([
    {
      id: 's1',
      browser: 'Firefox',
      device_type: 'desktop',
      is_active: true,
      last_activity: '2026-09-29T12:00:00Z',
      expires_at: '2026-10-29T12:00:00Z',
    },
    {
      id: 's2',
      browser: 'Safari',
      device_type: 'mobile',
      is_active: true,
      last_activity: '2026-09-28T08:30:00Z',
      expires_at: '2026-10-28T08:30:00Z',
    },
  ]),
};
