// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { withZephyrexApi } from 'zephyrex/testing';
import { TeamInvitations } from './TeamInvitations';

const TEAM = 't-alpha';
const USER_ROLE = { id: 'r-user', name: 'user', friendly_name: 'User', parent_id: null, team_id: null };
const ADMIN_ROLE = { id: 'r-admin', name: 'admin', friendly_name: 'Admin', parent_id: 'r-user', team_id: null };

const meta: Meta<typeof TeamInvitations> = {
  title: 'auth-invitations/TeamInvitations',
  component: TeamInvitations,
  tags: ['autodocs'],
  parameters: {
    nextjs: { appDirectory: true },
    layout: 'padded',
    msw: {
      handlers: [
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
  },
  decorators: [withZephyrexApi],
  args: { teamId: TEAM, teamName: 'Analytical Engines', roles: [USER_ROLE, ADMIN_ROLE] },
};
export default meta;

type Story = StoryObj<typeof TeamInvitations>;

export const AsAdmin: Story = { args: { admin: true, assignable: [USER_ROLE, ADMIN_ROLE] } };

export const AsMember: Story = { args: { admin: false, assignable: [] } };
