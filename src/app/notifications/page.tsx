'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactNode, useState } from 'react';
import { EmptyNotifications, Notifications } from '@/components/appwrapper/src/Notifications';
import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { useMarkNotificationRead, useNotifications } from '@/lib/zephyrex/hooks';

export default function NotificationsPage(): ReactNode {
  const { data: notifications = [], error, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [markFailure, setMarkFailure] = useState<string | null>(null);

  return (
    <SidebarPage title='Notifications'>
      {markFailure !== null && (
        <p role='alert' className='p-4 text-sm text-destructive'>
          The notification could not be marked read: {markFailure}
        </p>
      )}
      {error !== undefined && (
        <p role='alert' className='p-4 text-sm text-destructive'>
          Your notifications could not be loaded: {error.message}
        </p>
      )}
      {isLoading && <p className='p-4 text-sm text-muted-foreground'>Loading…</p>}
      {!isLoading && error === undefined && notifications.length === 0 && <EmptyNotifications />}
      {notifications.length > 0 && (
        <Notifications
          notifications={notifications}
          onMarkRead={(notification) => {
            void (async (): Promise<void> => {
              setMarkFailure(null);
              try {
                await markRead(notification.id);
              } catch (failure) {
                setMarkFailure(failure instanceof Error ? failure.message : notification.title);
              }
            })();
          }}
        />
      )}
    </SidebarPage>
  );
}
