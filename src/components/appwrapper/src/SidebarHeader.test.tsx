// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { SidebarHeader as Component } from './SidebarHeader';

describe('SidebarHeader', () => {
  it('renders inside provider tree', () => {
    const { container } = render(
      <TestWrapper>
        <Component><span>header</span></Component>
      </TestWrapper>,
    );
    expect(container).toBeInTheDocument();
  });
});
