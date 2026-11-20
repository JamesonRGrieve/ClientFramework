// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderToString } from 'react-dom/server';
import { usePathname } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NoScriptNav } from './NoScriptNav';
import { TestWrapper } from '@/testing/TestWrapper';

const NAV = [
  { title: 'People', url: '/genealogy' },
  { title: 'Care', url: '/care', children: [{ title: 'Gifts', url: '/gifts' }] },
];

const NOSCRIPT = '<noscript>';

describe('NoScriptNav', () => {
  afterEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
  });

  it('lists nothing on the landing page or the sign-in pages, where the sidebar isn’t shown', () => {
    for (const path of ['/', '/user', '/user/login']) {
      vi.mocked(usePathname).mockReturnValue(path);
      const html = renderToString(
        <TestWrapper config={{ navItems: NAV }}>
          <NoScriptNav />
        </TestWrapper>,
      );
      expect(html, path).not.toContain(NOSCRIPT);
    }
  });

  it('serves the sidebar’s pages as plain links inside <noscript>, and hides the scripted button', () => {
    vi.mocked(usePathname).mockReturnValue('/genealogy');
    const html = renderToString(
      <TestWrapper config={{ navItems: NAV }}>
        <NoScriptNav />
      </TestWrapper>,
    );
    expect(html).toContain(NOSCRIPT);
    expect(html).toContain('<summary');
    expect(html).toContain('href="/genealogy"');
    expect(html).toContain('href="/gifts"');
    expect(html).toContain('[data-sidebar="trigger"]{display:none}');
  });

  it('renders nothing for an app with no pages in its sidebar', () => {
    const html = renderToString(
      <TestWrapper config={{ navItems: [] }}>
        <NoScriptNav />
      </TestWrapper>,
    );
    expect(html).not.toContain(NOSCRIPT);
  });
});
