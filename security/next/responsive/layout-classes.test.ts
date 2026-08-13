// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Responsive layout verification — checks that components use the correct
 * responsive classes to prevent clipping and overflow on mobile/tablet.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

describe('SidebarPage — responsive toggle', () => {
  it('sidebar toggle uses md:hidden for desktop hiding', () => {
    const source = readFileSync('src/components/appwrapper/src/SidebarPage.tsx', 'utf8');
    expect(source).toContain('md:hidden');
  });
});

describe('NavUser — responsive layout', () => {
  it('user name uses truncate class to prevent overflow', () => {
    const source = readFileSync('src/components/appwrapper/src/NavUser.tsx', 'utf8');
    expect(source).toContain('truncate');
  });

  it('dropdown changes side based on isMobile', () => {
    const source = readFileSync('src/components/appwrapper/src/NavUser.tsx', 'utf8');
    expect(source).toContain("isMobile ? 'bottom' : 'right'");
  });
});

describe('Sidebar — responsive behavior classes', () => {
  it('sidebar uses group-data-[collapsible=icon] for collapsed state', () => {
    const source = readFileSync('src/components/ui/sidebar.tsx', 'utf8');
    expect(source).toContain('group-data-[collapsible=icon]');
  });

  it('sidebar has lg: breakpoint classes for desktop layout', () => {
    const source = readFileSync('src/components/ui/sidebar.tsx', 'utf8');
    expect(source).toContain('lg:');
  });
});

describe('App page — responsive header', () => {
  it('header uses responsive padding', () => {
    const source = readFileSync('src/app/page.tsx', 'utf8');
    expect(source).toContain('px-4');
    expect(source).toContain('md:px-6');
  });
});

describe('DataTable — responsive overflow', () => {
  it('data table has border or overflow container', () => {
    const source = readFileSync('src/components/data-table/index.tsx', 'utf8');
    const hasContainer =
      source.includes('overflow-x-auto') ||
      source.includes('overflow-auto') ||
      source.includes('border rounded-md');
    expect(hasContainer).toBe(true);
  });

  it('pagination uses responsive spacing', () => {
    const source = readFileSync('src/components/data-table/data-table-pagination.tsx', 'utf8');
    expect(source).toContain('lg:');
  });

  it('pagination first/last buttons hidden on small screens', () => {
    const source = readFileSync('src/components/data-table/data-table-pagination.tsx', 'utf8');
    expect(source).toContain('hidden');
    expect(source).toContain('lg:flex');
  });
});

describe('Header/Footer — responsive safe area', () => {
  it('layout uses safe-area-inset for mobile notch', () => {
    const source = readFileSync('src/app/page.tsx', 'utf8');
    expect(source).toContain('safe-area-inset');
  });
});

describe('AppWrapper header — mobile sticky behavior', () => {
  it('header uses fixed positioning on mobile', () => {
    const source = readFileSync('src/components/appwrapper/src/AppWrapperHeaderFooter.tsx', 'utf8');
    expect(source).toContain('fixed');
    expect(source).toContain('safe-area-inset-top');
  });
});
