// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from '@/__tests__/test-wrapper';
import Component from './AppWrapper';

describe('AppWrapper', () => {
  it('renders inside provider tree', () => {
    const { container } = render(
      <TestWrapper>
        <Component><div>test content</div></Component>
      </TestWrapper>,
    );
    expect(container).toBeInTheDocument();
  });
});
