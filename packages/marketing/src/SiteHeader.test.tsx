// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CTA, NAV } from './marketing.mocks';
import { SiteHeader } from './SiteHeader';

describe('SiteHeader', () => {
  it('links home through the brand, and lists the links and the call to action in both menus', () => {
    render(<SiteHeader brand={<span>Zephyrex RPG AI</span>} nav={NAV} cta={CTA} />);
    expect(screen.getByRole('link', { name: 'Zephyrex RPG AI' })).toHaveAttribute('href', '/');
    const menus = screen.getAllByRole('navigation', { name: 'Main' });
    expect(menus).toHaveLength(2);
    for (const menu of menus) {
      expect(within(menu).getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
      expect(within(menu).getByRole('link', { name: 'Get started' })).toBeInTheDocument();
    }
  });
});
