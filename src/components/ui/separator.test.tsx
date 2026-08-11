// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Separator } from './separator';

describe('Separator', () => {
  it('renders with role separator', () => {
    render(<Separator />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Separator className='custom-class' />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
