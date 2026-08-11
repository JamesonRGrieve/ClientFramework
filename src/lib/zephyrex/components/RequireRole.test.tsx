// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RequireRole } from './RequireRole';

vi.mock('../hooks', () => ({
  useRole: vi.fn(() => ({ isAdmin: false, isSuperAdmin: false, roleId: null })),
}));

import { useRole } from '../hooks';
const mockUseRole = vi.mocked(useRole);

describe('RequireRole', () => {
  it('hides children when user lacks admin role', () => {
    mockUseRole.mockReturnValue({ isAdmin: false, isSuperAdmin: false, roleId: null });
    render(<RequireRole role="admin"><span>Admin Content</span></RequireRole>);
    expect(screen.queryByText('Admin Content')).toBeNull();
  });

  it('shows children when user has admin role', () => {
    mockUseRole.mockReturnValue({ isAdmin: true, isSuperAdmin: false, roleId: 'admin-id' });
    render(<RequireRole role="admin"><span>Admin Content</span></RequireRole>);
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('hides children when admin requests superadmin', () => {
    mockUseRole.mockReturnValue({ isAdmin: true, isSuperAdmin: false, roleId: 'admin-id' });
    render(<RequireRole role="superadmin"><span>Super Content</span></RequireRole>);
    expect(screen.queryByText('Super Content')).toBeNull();
  });

  it('shows children when user has superadmin role', () => {
    mockUseRole.mockReturnValue({ isAdmin: true, isSuperAdmin: true, roleId: 'super-id' });
    render(<RequireRole role="superadmin"><span>Super Content</span></RequireRole>);
    expect(screen.getByText('Super Content')).toBeInTheDocument();
  });

  it('renders fallback when unauthorized', () => {
    mockUseRole.mockReturnValue({ isAdmin: false, isSuperAdmin: false, roleId: null });
    render(
      <RequireRole role="admin" fallback={<span>Access Denied</span>}>
        <span>Hidden</span>
      </RequireRole>,
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).toBeNull();
  });
});
