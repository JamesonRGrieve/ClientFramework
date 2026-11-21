// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FOOTER } from './marketing.mocks';
import { SiteFooter } from './SiteFooter';

describe('SiteFooter', () => {
  it('lists each column of links, and the note when given', () => {
    render(<SiteFooter columns={FOOTER} note='Made for tables everywhere.' />);
    expect(screen.getByRole('navigation', { name: 'Footer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Product' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/docs/privacy');
    expect(screen.getByText('Made for tables everywhere.')).toBeInTheDocument();
  });

  it('takes a block note, such as a paragraph and a list, without nesting it in a paragraph', () => {
    render(
      <SiteFooter
        columns={FOOTER}
        note={
          <>
            <p>Made for tables everywhere.</p>
            <ul>
              <li>No ads</li>
            </ul>
          </>
        }
      />,
    );
    const note = screen.getByText('Made for tables everywhere.');
    expect(note.parentElement?.closest('p')).toBeNull();
    expect(screen.getByText('No ads').closest('p')).toBeNull();
  });

  it('puts its column titles at the level the page needs', () => {
    render(<SiteFooter columns={FOOTER} level={3} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Product' })).toBeInTheDocument();
  });
});
