// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders with role switch', () => {
    render(<Switch />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Switch className='custom-class' />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
