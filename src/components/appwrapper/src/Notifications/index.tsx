'use client';
import { dummyNotifications } from '@/app/notifications/page';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipBasic } from '@/components/ui/tooltip';
import { formatTimeAgo } from '@/lib/time-ago';
import { useRouter } from 'next/navigation';

export function Notifications({ notifications }: { notifications: typeof dummyNotifications }) {
  const router = useRouter();

  return (
    <div className='p-4 space-y-2'>
      {notifications.map((notification) => (
        <Card
          key={notification.messageId}
          className='transition-colors cursor-pointer hover:bg-accent/50'
          onClick={() => router.push(`/chat/${notification.conversationId}`)}
        >
          <CardContent className='p-4'>
            <div className='space-y-2'>
              <div className='flex items-start justify-between'>
                <h3 className='font-semibold'>{notification.conversationName}</h3>
                <TooltipBasic title={formatDate(notification.createdAt)}>
                  <span className='text-sm cursor-default text-muted-foreground'>
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </TooltipBasic>
              </div>
              <p className='text-sm text-muted-foreground'>{notification.content}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EmptyNotifications() {
  return (
    <div className='flex flex-col items-center justify-center h-full'>
      <h2 className='mb-4 text-2xl'>No notifications</h2>
      <p className='text-muted-foreground'>You have no notifications to display</p>
    </div>
  );
}

function formatDate(timestamp: string) {
  return new Date(timestamp).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
