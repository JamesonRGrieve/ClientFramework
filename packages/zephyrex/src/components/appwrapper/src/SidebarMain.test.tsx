// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SidebarLogo } from './SidebarMain';
import { TestWrapper } from '@/testing/TestWrapper';

describe('SidebarLogo', () => {
  it("shows the app's name from its config", () => {
    const view = render(
      <TestWrapper>
        <SidebarLogo />
      </TestWrapper>,
    );
    expect(view.getByText('Test App')).toBeInTheDocument();
  });

  it("shows the app's logo when it has one", () => {
    const view = render(
      <TestWrapper config={{ app: { name: 'Test App', logo: () => <svg data-testid='logo' /> } }}>
        <SidebarLogo />
      </TestWrapper>,
    );
    expect(view.getByTestId('logo')).toBeInTheDocument();
  });
});
