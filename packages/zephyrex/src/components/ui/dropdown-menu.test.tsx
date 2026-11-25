// SPDX-License-Identifier: AGPL-3.0-or-later
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

const MORE = { name: 'More' };

function Menu(): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>More</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('renders without crashing', () => {
    const { container } = render(<DropdownMenu>content</DropdownMenu>);
    expect(container).toBeInTheDocument();
  });

  it('opens on a finished touch tap, not on touching down, so a scroll over it opens nothing', () => {
    const view = render(<Menu />);
    const trigger = view.getByRole('button', MORE);
    // A finger landing on the button to scroll: nothing opens.
    fireEvent.pointerDown(trigger, { pointerType: 'touch', button: 0 });
    expect(view.queryByRole('menu')).toBeNull();
    // The tap finishes: it opens, and a second tap closes it.
    fireEvent.click(trigger);
    expect(view.getByRole('menu')).toBeInTheDocument();
    fireEvent.pointerDown(trigger, { pointerType: 'touch', button: 0 });
    fireEvent.click(trigger);
    expect(view.queryByRole('menu')).toBeNull();
  });

  it('still opens on pressing the mouse, as Radix does', () => {
    const view = render(<Menu />);
    fireEvent.pointerDown(view.getByRole('button', MORE), { pointerType: 'mouse', button: 0, ctrlKey: false });
    expect(view.getByRole('menu')).toBeInTheDocument();
  });
});
