// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hero } from './Hero';
import { CTA } from './marketing.mocks';

describe('Hero', () => {
  it("carries the page's h1, its actions and the sample", () => {
    render(
      <Hero
        title='Play anywhere'
        lead='A lead.'
        primary={CTA}
        secondary={{ label: 'Learn more', href: '/features' }}
        sample={<figure>Sample</figure>}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Play anywhere' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/start');
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '/features');
    expect(screen.getByText('Sample')).toBeInTheDocument();
  });

  it('leaves out what it is not given', () => {
    render(<Hero title='Play anywhere' lead='A lead.' primary={CTA} />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
