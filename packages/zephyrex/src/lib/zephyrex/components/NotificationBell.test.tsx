// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotificationBell } from './NotificationBell';
import { TestWrapper } from '@/testing/TestWrapper';

describe('NotificationBell', () => {
  it('renders bell button inside provider tree', () => {
    render(
      <TestWrapper>
        <NotificationBell />
      </TestWrapper>,
    );
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(
      <TestWrapper>
        <NotificationBell />
      </TestWrapper>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});
