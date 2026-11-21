// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SidebarPage as Component } from './SidebarPage';
import { TestWrapper } from '@/testing/TestWrapper';

describe('SidebarPage', () => {
  it('renders inside provider tree', () => {
    const { container } = render(
      <TestWrapper>
        <Component title="Test Page"><div>content</div></Component>
      </TestWrapper>,
    );
    expect(container).toBeInTheDocument();
  });

  describe('the bar never repeats the page title', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('warns the developer when the bar says what the h1 says', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(
        <TestWrapper>
          <Component title='People'>
            <h1>People</h1>
          </Component>
        </TestWrapper>,
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('repeats the page\'s h1'));
    });

    it('stays quiet when the bar names the section and the h1 the page', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(
        <TestWrapper>
          <Component title='People'>
            <h1>Alex Chen</h1>
          </Component>
        </TestWrapper>,
      );
      expect(warn).not.toHaveBeenCalled();
    });
  });
});
