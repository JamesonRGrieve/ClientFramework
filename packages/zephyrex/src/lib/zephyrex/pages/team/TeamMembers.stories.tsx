// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { withSignedIn, withZephyrexApi } from '../../../../testing/storyRoot';
import { TeamMembers } from './TeamMembers';

const ME = 'u-me';
const TEAM = 't-alpha';
const USER_ROLE = { id: 'r-user', name: 'user', friendly_name: 'User', parent_id: null, team_id: null };
const ADMIN_ROLE = { id: 'r-admin', name: 'admin', friendly_name: 'Admin', parent_id: 'r-user', team_id: null };

const membership = (
  id: string,
  user: { id: string; email: string; first_name: string; last_name: string },
  admin: boolean,
) => {
  const role = admin ? ADMIN_ROLE : USER_ROLE;
  return { id, user_id: user.id, team_id: TEAM, role_id: role.id, user, role };
};

/** The team's members, with Ada an admin or not, and one pending invitation. */
const team = (admin: boolean) => ({
  msw: {
    handlers: [
      http.get('*/v1/user', () => HttpResponse.json({ user: { id: ME, email: 'ada@example.com' } })),
      http.get('*/v1/team', () =>
        HttpResponse.json({ teams: [{ id: TEAM, name: 'Analytical Engines', description: null }] }),
      ),
      http.get(`*/v1/team/${TEAM}/user`, () =>
        HttpResponse.json({
          user_teams: [
            membership('m1', { id: ME, email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace' }, admin),
            membership(
              'm2',
              { id: 'u-charles', email: 'charles@example.com', first_name: 'Charles', last_name: 'Babbage' },
              false,
            ),
          ],
        }),
      ),
      http.get('*/v1/role', () => HttpResponse.json({ roles: [USER_ROLE, ADMIN_ROLE], pagination: { has_more: false } })),
      http.get(`*/v1/team/${TEAM}/invitation`, () =>
        HttpResponse.json({
          invitations: [
            {
              id: 'inv-1',
              created_at: '2026-09-20T00:00:00Z',
              role_id: USER_ROLE.id,
              code: 'ABCD1234',
              invitees: [{ id: 'e1', email: 'mary@example.com', created_at: '2026-09-20T00:00:00Z' }],
            },
          ],
          pagination: { has_more: false },
        }),
      ),
    ],
  },
});

const meta: Meta<typeof TeamMembers> = {
  title: 'zephyrex/Team/TeamMembers',
  component: TeamMembers,
  tags: ['autodocs'],
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  decorators: [withSignedIn, withZephyrexApi],
  args: { teamId: TEAM },
};
export default meta;

type Story = StoryObj<typeof TeamMembers>;

export const AsAdmin: Story = { parameters: team(true) };

export const AsMember: Story = { parameters: team(false) };
