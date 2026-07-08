'use client';

import { type ReactNode, useState } from 'react';
import { SidebarPage } from '@jgrieve/appwrapper/SidebarPage';
import { EmptyNotifications, Notifications } from '@/components/appwrapper/src/Notifications';
import type { NotificationFixture } from '@/lib/notifications-fixtures';

export default function NotificationsPage(): ReactNode {
  const [notifications] = useState<NotificationFixture[]>([]);
  return (
    <SidebarPage title='Notifications'>
      {notifications.length > 0 ? <Notifications notifications={notifications} /> : <EmptyNotifications />}
    </SidebarPage>
  );
}
