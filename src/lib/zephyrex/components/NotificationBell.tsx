// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks';

export function NotificationBell({ className }: { className?: string }) {
  const { data: notifications } = useNotifications();
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <button
      className={`relative inline-flex items-center ${className ?? ''}`}
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
    >
      <Bell className='h-5 w-5' />
      {unread > 0 && (
        <span className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground'>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
