// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { NotificationBell } from './NotificationBell';

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
