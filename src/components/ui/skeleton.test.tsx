// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('applies the expected class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('accepts className prop', () => {
    const { container } = render(<Skeleton className='custom-class' />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
