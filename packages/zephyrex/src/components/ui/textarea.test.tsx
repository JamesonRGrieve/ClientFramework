// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders a textbox', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Textarea className='custom-class' />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
