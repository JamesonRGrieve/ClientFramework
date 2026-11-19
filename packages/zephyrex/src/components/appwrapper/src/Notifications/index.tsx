'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
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
    <ul aria-label='Notifications' className='divide-y rounded-lg border'>
      {notifications.map((notification) => (
        <li key={notification.id} className='group flex items-start gap-3 px-4 py-3'>
          <span
            aria-hidden='true'
            className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.read ? 'bg-transparent' : 'bg-primary'}`}
          />
          <div className='grid min-w-0 flex-1 gap-0.5'>
            <h3 className={notification.read ? 'text-sm font-medium text-muted-foreground' : 'text-sm font-semibold'}>
              {notification.title}
              {!notification.read && (
                <>
                  {' '}
                  <span className='sr-only'>(unread)</span>
                </>
              )}
            </h3>
            <p className='text-sm text-muted-foreground'>{notification.content}</p>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            {!notification.read && (
              <Button
                size='sm'
                variant='ghost'
                className='h-7 transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100'
                aria-label={`Mark “${notification.title}” as read`}
                onClick={() => {
                  onMarkRead(notification);
                }}
              >
                Mark as read
              </Button>
            )}
            <TooltipBasic title={formatDate(notification.createdAt)}>
              <time dateTime={notification.createdAt} className='cursor-default whitespace-nowrap text-xs text-muted-foreground'>
                {formatTimeAgo(notification.createdAt, 'round-minute')}
              </time>
            </TooltipBasic>
          </div>
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
