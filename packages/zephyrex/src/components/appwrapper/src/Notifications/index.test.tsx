// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyNotifications, Notifications } from './index';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Notification as InboxNotification } from '@/lib/zephyrex/hooks';

const notification = (id: string, read: boolean): InboxNotification => ({
  id,
  notificationId: `n-${id}`,
  title: `Title ${id}`,
  content: `Body ${id}`,
  referenceType: null,
  referenceId: null,
  createdAt: '2026-09-01T00:00:00Z',
  read,
  acknowledged: false,
  delivery: { created_at: '2026-09-01T00:00:00Z' },
});

describe('Notifications', () => {
  it('lists each notification and offers mark-as-read only on unread ones', async () => {
    const onMarkRead = vi.fn();
    const user = userEvent.setup();
    const unread = notification('d1', false);
    const view = render(
      <TooltipProvider>
        <Notifications notifications={[unread, notification('d2', true)]} onMarkRead={onMarkRead} />
      </TooltipProvider>,
    );

    const items = within(view.getByRole('list', { name: 'Notifications' })).getAllByRole('listitem');
    // What a screen reader announces, not the raw text: the sr-only marker must stay a separate word.
    expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual(['Title d1 (unread)', 'Title d2']);
    expect(view.getByRole('heading', { name: 'Title d1 (unread)' })).toBeInTheDocument();
    expect(view.getAllByRole('button', { name: /as read$/ })).toHaveLength(1);

    await user.click(view.getByRole('button', { name: 'Mark “Title d1” as read' }));
    expect(onMarkRead).toHaveBeenCalledWith(unread);
  });

  it('says so when there is nothing to show', () => {
    expect(render(<EmptyNotifications />).getByRole('heading', { name: 'No notifications' })).toBeInTheDocument();
  });
});
