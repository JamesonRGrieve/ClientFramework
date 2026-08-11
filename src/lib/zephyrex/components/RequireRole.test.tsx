// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { RequireRole } from './RequireRole';

describe('RequireRole', () => {
  it('renders children inside provider tree', () => {
    render(
      <TestWrapper>
        <RequireRole role="admin" fallback={<span>Denied</span>}>
          <span>Admin Content</span>
        </RequireRole>
      </TestWrapper>,
    );
    // Without auth, useUser returns null, so role check fails — fallback renders
    expect(screen.getByText('Denied')).toBeInTheDocument();
  });

  it('renders fallback when no user is authenticated', () => {
    render(
      <TestWrapper>
        <RequireRole role="superadmin" fallback={<span>No Access</span>}>
          <span>Super Content</span>
        </RequireRole>
      </TestWrapper>,
    );
    expect(screen.getByText('No Access')).toBeInTheDocument();
    expect(screen.queryByText('Super Content')).toBeNull();
  });

  it('renders nothing when no fallback provided and unauthorized', () => {
    const { container } = render(
      <TestWrapper>
        <RequireRole role="admin">
          <span>Hidden</span>
        </RequireRole>
      </TestWrapper>,
    );
    expect(screen.queryByText('Hidden')).toBeNull();
    expect(container.textContent).toBe('');
  });
});
