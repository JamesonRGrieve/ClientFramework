// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Slider } from './slider';

describe('Slider', () => {
  it('renders with role slider', () => {
    render(<Slider />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Slider className='custom-class' />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
