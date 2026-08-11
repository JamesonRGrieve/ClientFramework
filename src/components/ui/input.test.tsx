// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('renders a textbox', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Input className='custom-class' />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
