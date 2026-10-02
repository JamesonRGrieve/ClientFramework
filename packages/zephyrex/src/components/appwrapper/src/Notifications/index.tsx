'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipBasic } from '@/components/ui/tooltip';
import { formatTimeAgo } from '@/lib/time-ago';
import type { Notification as InboxNotification } from '@/lib/zephyrex/hooks';

const formatDate = (timestamp: string): string =>
  new Date(timestamp).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });

/** The signed-in user's notifications, newest first; unread ones can be marked read. */
export function Notifications({
  notifications,
  onMarkRead,
}: {
  notifications: readonly InboxNotification[];
  onMarkRead: (notification: InboxNotification) => void;
}): JSX.Element {
  return (
    <ul aria-label='Notifications' className='space-y-2 p-4'>
      {notifications.map((notification) => (
        <li key={notification.id}>
          <Card className={notification.read ? 'opacity-70' : 'border-primary'}>
            <CardContent className='space-y-2 p-4'>
              <div className='flex items-start justify-between gap-2'>
                <h3 className='font-semibold'>
                  {notification.title}
                  {!notification.read && (
                    <>
                      {' '}
                      <span className='sr-only'>(unread)</span>
                    </>
                  )}
                </h3>
                <TooltipBasic title={formatDate(notification.createdAt)}>
                  <span className='cursor-default text-sm text-muted-foreground'>
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </TooltipBasic>
              </div>
              <p className='text-sm text-muted-foreground'>{notification.content}</p>
              {!notification.read && (
                <Button
                  size='sm'
                  variant='outline'
                  aria-label={`Mark “${notification.title}” as read`}
                  onClick={() => {
                    onMarkRead(notification);
                  }}
                >
                  Mark as read
                </Button>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function EmptyNotifications(): JSX.Element {
  return (
    <div className='flex h-full flex-col items-center justify-center'>
      <h2 className='mb-4 text-2xl'>No notifications</h2>
      <p className='text-muted-foreground'>You have no notifications to display</p>
    </div>
  );
}
