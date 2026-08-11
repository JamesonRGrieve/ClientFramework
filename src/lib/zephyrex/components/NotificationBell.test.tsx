// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationBell } from './NotificationBell';

vi.mock('../hooks', () => ({
  useNotifications: vi.fn(() => ({ data: [] })),
}));

import { useNotifications } from '../hooks';
const mockUseNotifications = vi.mocked(useNotifications);

describe('NotificationBell', () => {
  it('renders bell button', () => {
    mockUseNotifications.mockReturnValue({ data: [], isLoading: false, error: undefined, isValidating: false, mutate: vi.fn() } as any);
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('shows unread count badge', () => {
    mockUseNotifications.mockReturnValue({
      data: [
        { id: '1', message: 'Test', read: false, created_at: '' },
        { id: '2', message: 'Test2', read: true, created_at: '' },
      ],
      isLoading: false, error: undefined, isValidating: false, mutate: vi.fn(),
    } as any);
    render(<NotificationBell />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('hides badge when no unread', () => {
    mockUseNotifications.mockReturnValue({
      data: [{ id: '1', message: 'Test', read: true, created_at: '' }],
      isLoading: false, error: undefined, isValidating: false, mutate: vi.fn(),
    } as any);
    render(<NotificationBell />);
    expect(screen.queryByText('1')).toBeNull();
  });

  it('caps badge at 9+', () => {
    const notifications = Array.from({ length: 15 }, (_, i) => ({
      id: String(i), message: `N${i}`, read: false, created_at: '',
    }));
    mockUseNotifications.mockReturnValue({
      data: notifications, isLoading: false, error: undefined, isValidating: false, mutate: vi.fn(),
    } as any);
    render(<NotificationBell />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });
});
