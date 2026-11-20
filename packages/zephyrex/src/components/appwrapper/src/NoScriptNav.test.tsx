// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NoScriptNav } from './NoScriptNav';
import { TestWrapper } from '@/testing/TestWrapper';

const NAV = [
  { title: 'People', url: '/genealogy' },
  { title: 'Care', url: '/care', children: [{ title: 'Gifts', url: '/gifts' }] },
];

describe('NoScriptNav', () => {
  it('serves the sidebar’s pages as plain links inside <noscript>, and hides the scripted button', () => {
    const html = renderToString(
      <TestWrapper config={{ navItems: NAV }}>
        <NoScriptNav />
      </TestWrapper>,
    );
    expect(html).toContain('<noscript>');
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
    expect(html).not.toContain('<noscript>');
  });
});
