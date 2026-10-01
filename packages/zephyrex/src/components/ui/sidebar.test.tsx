// SPDX-License-Identifier: AGPL-3.0-or-later
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as mod from './sidebar';
import { Sidebar, SidebarMenuSkeleton, SidebarProvider, SidebarRail } from './sidebar';

const START_X = 100;
const DEFAULT_WIDTH_PX = 256;
const MAX_WIDTH_PX = 600;
const STATE = 'data-state';
const RESIZING = 'data-resizing';

function renderRail(): { rail: HTMLElement; sidebar: HTMLElement; unmount: () => void } {
  const { unmount } = render(
    <SidebarProvider>
      <Sidebar>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>,
  );
  const rail = screen.getByRole('button', { name: 'Toggle Sidebar' });
  const sidebar = rail.closest<HTMLElement>('[data-side]');
  if (sidebar === null) {
    throw new Error('the rail is not inside its sidebar');
  }
  return { rail, sidebar, unmount };
}

const sidebarWidth = (sidebar: HTMLElement): string => sidebar.style.getPropertyValue('--sidebar-width');

/** Presses the rail at START_X, then moves past the drag threshold so the press becomes a drag. */
function startDrag(rail: HTMLElement): void {
  fireEvent.mouseDown(rail, { clientX: START_X });
  fireEvent.mouseMove(document, { clientX: START_X + 10 });
}

describe('sidebar', () => {
  it('module exports', () => {
    expect(mod).toBeDefined();
  });

  it('toggles the sidebar when the rail is clicked in place', () => {
    const { rail, sidebar } = renderRail();
    expect(sidebar).toHaveAttribute(STATE, 'expanded');
    fireEvent.mouseDown(rail, { clientX: START_X });
    fireEvent.mouseUp(document, { clientX: START_X + 1 });
    expect(sidebar).toHaveAttribute(STATE, 'collapsed');
  });

  it('resizes the sidebar while the rail is dragged, and stops when it is released', () => {
    const { rail, sidebar } = renderRail();
    startDrag(rail);
    expect(rail).toHaveAttribute(RESIZING, 'true');
    expect(document.body.style.userSelect).toBe('none');

    fireEvent.mouseMove(document, { clientX: START_X + 50 });
    expect(sidebarWidth(sidebar)).toBe(`${DEFAULT_WIDTH_PX + 50}px`);

    fireEvent.mouseUp(document, { clientX: START_X + 50 });
    expect(rail).toHaveAttribute(RESIZING, 'false');
    expect(document.body.style.userSelect).toBe('');
    expect(sidebar).toHaveAttribute(STATE, 'expanded');

    fireEvent.mouseMove(document, { clientX: START_X + 90 });
    expect(sidebarWidth(sidebar)).toBe(`${DEFAULT_WIDTH_PX + 50}px`);
  });

  it('keeps a dragged width within the maximum', () => {
    const { rail, sidebar } = renderRail();
    startDrag(rail);
    fireEvent.mouseMove(document, { clientX: START_X + 1000 });
    expect(sidebarWidth(sidebar)).toBe(`${MAX_WIDTH_PX}px`);
  });

  it('lets go of the page when the rail unmounts mid-drag', () => {
    const { rail, unmount } = renderRail();
    startDrag(rail);
    unmount();
    expect(document.body.style.userSelect).toBe('');
    expect(() => fireEvent.mouseMove(document, { clientX: START_X + 50 })).not.toThrow();
  });

  it('keeps a loading skeleton the same width across renders', () => {
    const { container, rerender } = render(<SidebarMenuSkeleton />);
    const text = (): HTMLElement | null => container.querySelector('[data-sidebar="menu-skeleton-text"]');
    const width = text()?.style.getPropertyValue('--skeleton-width');
    expect(width).toMatch(/^\d+%$/);
    rerender(<SidebarMenuSkeleton className='again' />);
    expect(text()?.style.getPropertyValue('--skeleton-width')).toBe(width);
  });
});
