// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { http, HttpResponse } from 'msw';
import { withZephyrexApi } from '../../../../testing/storyRoot';
import { PendingInvitations } from './Invitations';
import type { PendingInvitation } from './invitationsModel';
import { USER_INVITATIONS_ENDPOINT } from './useUserInvitations';

const awaiting = (invitations: PendingInvitation[]) => ({
  msw: { handlers: [http.get(`*${USER_INVITATIONS_ENDPOINT}`, () => HttpResponse.json({ invitations }))] },
});

const meta: Meta<typeof PendingInvitations> = {
  title: 'zephyrex/Team/PendingInvitations',
  component: PendingInvitations,
  tags: ['autodocs'],
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof PendingInvitations>;

export const None: Story = { parameters: awaiting([]) };

export const Several: Story = {
  parameters: awaiting([
    {
      id: 'inv-1',
      created_at: '2026-09-20T00:00:00Z',
      expires_at: '2026-10-20T00:00:00Z',
      team: { name: 'Alpha' },
      role: { name: 'Admin' },
      invitees: [{ id: 'row-1', status: 'pending' }],
    },
    {
      id: 'inv-2',
      created_at: '2026-09-21T00:00:00Z',
      team: { name: 'Beta' },
      invitees: [{ id: 'row-2', status: 'pending' }],
    },
  ]),
};
