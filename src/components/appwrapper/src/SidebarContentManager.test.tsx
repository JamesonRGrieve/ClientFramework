// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SIDEBAR_TITLE,
  SidebarContent,
  SidebarContentProvider,
  useSidebarContent,
  useSidebarTitle,
} from './SidebarContentManager';

function Probe(): ReactNode {
  const { content, title } = useSidebarContent();
  return (
    <div>
      <p data-testid='title'>{title}</p>
      <div data-testid='content'>{content}</div>
    </div>
  );
}

describe('SidebarContentManager', () => {
  it('starts with the default title and no content', () => {
    const view = render(
      <SidebarContentProvider>
        <Probe />
      </SidebarContentProvider>,
    );
    expect(view.getByTestId('title')).toHaveTextContent(DEFAULT_SIDEBAR_TITLE);
    expect(view.getByTestId('content')).toBeEmptyDOMElement();
  });

  it('shows what a page puts in it, and clears it when the page goes', () => {
    const page = (
      <SidebarContent title='Team Details'>
        <p>Members: 3</p>
      </SidebarContent>
    );
    const view = render(
      <SidebarContentProvider>
        {page}
        <Probe />
      </SidebarContentProvider>,
    );
    expect(view.getByTestId('title')).toHaveTextContent('Team Details');
    expect(view.getByTestId('content')).toHaveTextContent('Members: 3');
    view.rerender(
      <SidebarContentProvider>
        <Probe />
      </SidebarContentProvider>,
    );
    expect(view.getByTestId('title')).toHaveTextContent(DEFAULT_SIDEBAR_TITLE);
    expect(view.getByTestId('content')).toBeEmptyDOMElement();
  });

  it('refuses to be used without its provider', () => {
    expect(() => renderHook(() => useSidebarContent())).toThrow('within a SidebarContentProvider');
    expect(() => renderHook(() => useSidebarTitle())).toThrow('within a SidebarContentProvider');
  });
});
