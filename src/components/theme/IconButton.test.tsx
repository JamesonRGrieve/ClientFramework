// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import IconButton from './IconButton';

function TestIcon({ className }: { className?: string }) {
  return <span className={className} data-testid='icon' />;
}

describe('IconButton', () => {
  it('renders label text', () => {
    render(
      <TooltipProvider>
        <IconButton Icon={TestIcon} label='Light' description='Switch to light mode' />
      </TooltipProvider>,
    );
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(
      <TooltipProvider>
        <IconButton Icon={TestIcon} label='Dark' description='Switch to dark mode' />
      </TooltipProvider>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
