// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import type { Notification } from '@/lib/zephyrex/hooks';
import { EmptyNotifications, Notifications } from './index';

const notification = (id: string, title: string, read: boolean, createdAt: string): Notification => ({
  id,
  notificationId: `n-${id}`,
  title,
  content: `${title}: details about what happened.`,
  referenceType: null,
  referenceId: null,
  createdAt,
  read,
  acknowledged: read,
});

const meta: Meta<typeof Notifications> = {
  title: 'AppWrapper/Notifications',
  component: Notifications,
  args: { onMarkRead: () => undefined },
};
export default meta;

type Story = StoryObj<typeof Notifications>;

export const Mixed: Story = {
  args: {
    notifications: [
      notification('1', 'Invitation accepted', false, '2026-09-30T10:00:00Z'),
      notification('2', 'API key rotated', true, '2026-09-29T08:00:00Z'),
    ],
  },
};

export const AllRead: Story = {
  args: { notifications: [notification('3', 'Welcome to the team', true, '2026-09-20T12:00:00Z')] },
};

export const Empty: StoryObj<typeof EmptyNotifications> = {
  render: () => <EmptyNotifications />,
};
