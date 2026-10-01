// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { InviteForm } from './InviteForm';

const meta: Meta<typeof InviteForm> = {
  title: 'auth-invitations/InviteForm',
  component: InviteForm,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [withZephyrexApi],
  args: {
    teamId: '11111111-2222-3333-4444-555555555555',
    onInvited: async () => Promise.resolve(),
  },
};
export default meta;

type Story = StoryObj<typeof InviteForm>;

export const AdminInviting: Story = {
  args: {
    roles: [
      { id: 'r-user', name: 'user', friendly_name: 'User', parent_id: null, team_id: null },
      { id: 'r-admin', name: 'admin', friendly_name: 'Admin', parent_id: 'r-user', team_id: null },
    ],
  },
};

export const NoAssignableRoles: Story = {
  args: { roles: [] },
};
