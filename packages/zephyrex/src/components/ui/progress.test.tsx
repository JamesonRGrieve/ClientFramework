// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Progress } from './progress';

describe('Progress', () => {
  it('renders with role progressbar', () => {
    render(<Progress />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Progress className='custom-class' />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
