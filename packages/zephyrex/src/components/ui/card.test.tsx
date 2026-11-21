// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardTitle } from './card';

describe('Card', () => {
  it('renders without crashing', () => {
    const { container } = render(<Card>content</Card>);
    expect(container).toBeInTheDocument();
  });

  it('titles itself at the level the page needs, an h3 by default', () => {
    render(
      <>
        <CardTitle>Section</CardTitle>
        <CardTitle level={2}>Profile</CardTitle>
      </>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Section' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Profile' })).toBeInTheDocument();
  });
});
