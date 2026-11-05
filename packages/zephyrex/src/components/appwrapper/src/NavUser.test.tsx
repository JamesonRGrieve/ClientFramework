// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { getGravatarUrl } from '@zephyrex/auth/gravatar';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NavUser, UserAvatar, userInitials } from './NavUser';
import { SidebarProvider } from '@/components/ui/sidebar';
import type * as Hooks from '@/lib/zephyrex/hooks';
import { useUser } from '@/lib/zephyrex/hooks';
import { TestWrapper } from '@/testing/TestWrapper';

vi.mock('@zephyrex/auth/gravatar', () => ({ getGravatarUrl: vi.fn(() => 'https://gravatar.example/avatar') }));
vi.mock('@/lib/zephyrex/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof Hooks>()),
  useUser: vi.fn(),
}));

const ADA = { email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace' };

describe('UserAvatar', () => {
  afterEach(() => {
    vi.mocked(getGravatarUrl).mockClear();
  });

  it("asks Gravatar for the user's picture, with their initials meanwhile", () => {
    const view = render(
      <TestWrapper>
        <UserAvatar user={ADA} />
      </TestWrapper>,
    );
    expect(getGravatarUrl).toHaveBeenCalledWith('ada@example.com');
    expect(view.getByText('AL')).toBeInTheDocument();
  });

  it('never sends the email to Gravatar when the app turns it off', () => {
    const view = render(
      <TestWrapper config={{ app: { name: 'Test App', gravatar: false } }}>
        <UserAvatar user={ADA} />
      </TestWrapper>,
    );
    expect(getGravatarUrl).not.toHaveBeenCalled();
    expect(view.getByText('AL')).toBeInTheDocument();
  });
});

describe('userInitials', () => {
  it('is the first letter of each name, capitalised', () => {
    expect(userInitials({ first_name: 'ada', last_name: ' lovelace' })).toBe('AL');
  });

  it('is null without both names', () => {
    expect(userInitials({ first_name: 'Ada', last_name: '' })).toBeNull();
    expect(userInitials({ first_name: '  ', last_name: 'Lovelace' })).toBeNull();
    expect(userInitials({ first_name: null })).toBeNull();
    expect(userInitials({})).toBeNull();
  });
});

describe('NavUser', () => {
  it('names the account button while the user is still loading', () => {
    // Only skeletons inside: without a label the button has no accessible name (axe button-name).
    vi.mocked(useUser).mockReturnValue({ data: undefined, error: undefined, isValidating: true, isLoading: true, mutate: vi.fn() });
    render(
      <TestWrapper>
        <SidebarProvider>
          <NavUser />
        </SidebarProvider>
      </TestWrapper>,
    );
    expect(screen.getByRole('button', { name: 'Your account' })).toBeInTheDocument();
  });
});
