// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { withSignedIn, withZephyrexApi } from '../../../../../testing/storyRoot';
import { Manage } from './Manage';

const account = (teams: { id: string; name: string }[]) => ({
  msw: {
    handlers: [
      http.get('*/v1/user', () =>
        HttpResponse.json({
          user: { id: 'u1', email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace', timezone: 'Europe/London' },
        }),
      ),
      http.get('*/v1/team', () => HttpResponse.json({ teams: teams.map((team) => ({ ...team, description: null })) })),
      http.get('*/v1/user/invitation', () => HttpResponse.json({ invitations: [] })),
      http.get('*/v1/user/password-policy', () =>
        HttpResponse.json({ min_length: 8, max_bytes: 72, require_letter: true, require_digit: true }),
      ),
    ],
  },
});

const meta: Meta<typeof Manage> = {
  title: 'zephyrex/Account/Manage',
  component: Manage,
  tags: ['autodocs'],
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen' },
  decorators: [withSignedIn, withZephyrexApi],
  args: { heading: 'Account Management' },
};
export default meta;

type Story = StoryObj<typeof Manage>;

export const WithTeams: Story = { parameters: account([{ id: 't1', name: 'Analytical Engines' }]) };

export const NoTeams: Story = { parameters: account([]) };
