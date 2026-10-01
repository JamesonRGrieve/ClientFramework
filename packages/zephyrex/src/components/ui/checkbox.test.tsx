// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders with role checkbox', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Checkbox className='custom-class' />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
