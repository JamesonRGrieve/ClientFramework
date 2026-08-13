// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { SidebarPage as Component } from './SidebarPage';

describe('SidebarPage', () => {
  it('renders inside provider tree', () => {
    const { container } = render(
      <TestWrapper>
        <Component title="Test Page"><div>content</div></Component>
      </TestWrapper>,
    );
    expect(container).toBeInTheDocument();
  });
});
