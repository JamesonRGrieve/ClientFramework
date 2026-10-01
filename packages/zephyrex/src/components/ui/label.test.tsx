// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Label } from './label';

describe('Label', () => {
  it('renders text content', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Label className='custom-class' />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
