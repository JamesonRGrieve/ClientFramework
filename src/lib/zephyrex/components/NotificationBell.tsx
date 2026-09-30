// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks';

/** The most unread notifications the badge counts before it shows "9+". */
const BADGE_MAX = 9;

export function NotificationBell({ className }: { className?: string }) {
  const { data: notifications } = useNotifications();
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <button
      type='button'
      className={`relative inline-flex items-center ${className ?? ''}`}
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
    >
      <Bell className='h-5 w-5' />
      {unread > 0 && (
        <span className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground'>
          {unread > BADGE_MAX ? `${BADGE_MAX}+` : unread}
        </span>
      )}
    </button>
  );
}
