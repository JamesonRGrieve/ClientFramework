// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import type { ComponentType, ReactElement } from 'react';
import { SidebarProvider } from '../../../../components/ui/sidebar';
import { withSignedIn, withZephyrexApi } from '../../../../testing/storyRoot';
import { Team } from './Team';

const ME = 'u-me';
const ALPHA = 't-alpha';

/** Ada's two teams, on which she has `roleId`. */
const teams = (roleId: string) => ({
  msw: {
    handlers: [
      http.get('*/v1/user', () => HttpResponse.json({ user: { id: ME, email: 'ada@example.com' } })),
      http.get('*/v1/team', () =>
        HttpResponse.json({
          teams: [
            { id: ALPHA, name: 'Analytical Engines', description: 'Babbage’s machines' },
            { id: 't-beta', name: 'Difference Engines', description: null },
          ],
        }),
      ),
      http.get(`*/v1/team/${ALPHA}/user`, () =>
        HttpResponse.json({
          user_teams: [
            {
              id: 'm1',
              user_id: ME,
              team_id: ALPHA,
              role_id: roleId,
              user: { id: ME, email: 'ada@example.com' },
              role: { id: roleId, name: roleId === 'r-admin' ? 'admin' : 'user', parent_id: null },
            },
          ],
        }),
      ),
      http.get('*/v1/role', () =>
        HttpResponse.json({
          roles: [
            { id: 'r-user', name: 'user', parent_id: null, team_id: null },
            { id: 'r-admin', name: 'admin', parent_id: 'r-user', team_id: null },
          ],
          pagination: { has_more: false },
        }),
      ),
    ],
  },
});

const withSidebar = (Story: ComponentType): ReactElement => (
  <SidebarProvider>
    <Story />
  </SidebarProvider>
);

const meta: Meta<typeof Team> = {
  title: 'zephyrex/Team/Team',
  component: Team,
  tags: ['autodocs'],
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen' },
  decorators: [withSidebar, withSignedIn, withZephyrexApi],
  args: { teamId: ALPHA },
};
export default meta;

type Story = StoryObj<typeof Team>;

export const Admin: Story = { parameters: teams('r-admin') };

export const Member: Story = { parameters: teams('r-user') };
