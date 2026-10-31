// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserLayout } from './UserLayout';
import { TestWrapper } from '@/testing/TestWrapper';

const renderAt = (pathname: string, logo?: () => ReactNode): ReturnType<typeof render> => {
  vi.mocked(usePathname).mockReturnValue(pathname);
  return render(
    <TestWrapper {...(logo === undefined ? {} : { config: { app: { name: 'Test App', logo } } })}>
      <UserLayout>
        <p>step</p>
      </UserLayout>
    </TestWrapper>,
  );
};

describe('UserLayout', () => {
  afterEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
  });

  it('shows the auth steps under a link home named from the app config', () => {
    const view = renderAt('/user/login');
    expect(view.getByRole('link', { name: 'Test App' })).toHaveAttribute('href', '/');
    expect(view.getByText('step')).toBeInTheDocument();
  });

  it("puts the app's logo beside its name", () => {
    const view = renderAt('/user/login', () => <svg data-testid='logo' />);
    expect(view.getByRole('link', { name: 'Test App' })).toContainElement(view.getByTestId('logo'));
  });

  it('gives the account page the app shell instead', () => {
    const view = renderAt('/user/manage');
    expect(view.queryByRole('link', { name: 'Test App' })).not.toBeInTheDocument();
    expect(view.getByRole('heading', { name: 'Account Management' })).toBeInTheDocument();
    expect(view.getByText('step')).toBeInTheDocument();
  });
});
