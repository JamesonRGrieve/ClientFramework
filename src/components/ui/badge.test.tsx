// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders text content', () => {
    render(<Badge>Badge</Badge>);
    expect(screen.getByText('Badge')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Badge className='custom-class' />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
