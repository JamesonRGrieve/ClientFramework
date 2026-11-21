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

  it('outlines an off switch and fills an on one, so its edge and state show in every theme', () => {
    render(
      <>
        <Switch aria-label='Off' />
        <Switch aria-label='On' defaultChecked />
      </>,
    );
    // Off: the muted foreground outlines the track; a filled --input track was 1.3:1 in dark.
    expect(screen.getByRole('switch', { name: 'Off' })).toHaveClass(
      'data-[state=unchecked]:border-muted-foreground',
      'data-[state=unchecked]:bg-transparent',
    );
    expect(screen.getByRole('switch', { name: 'On' })).toHaveClass('data-[state=checked]:bg-primary');
  });
});
