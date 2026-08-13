// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { ToggleSidebar as Component } from './ToggleSidebar';

describe('ToggleSidebar', () => {
  it('renders inside provider tree', () => {
    const { container } = render(
      <TestWrapper>
        <Component side="left" />
      </TestWrapper>,
    );
    expect(container).toBeInTheDocument();
  });
});
