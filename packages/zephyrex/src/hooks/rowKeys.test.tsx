// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { rowList } from './rowKeys';

const SCARF = 'A silk scarf';
const ROWS = ['Peonies', SCARF, 'Tickets'];

function List({
  onOpen,
  onRemove,
}: {
  onOpen: (name: string) => void;
  onRemove: (name: string) => void;
}): React.JSX.Element {
  return (
    <ul ref={rowList} aria-label='Gifts'>
      {ROWS.map((name) => (
        <li key={name} data-row>
          <button type='button' data-row-open onClick={() => onOpen(name)}>
            Open {name}
          </button>
          <input aria-label={`Note on ${name}`} />
          <button type='button' data-row-remove onClick={() => onRemove(name)}>
            Delete {name}
          </button>
        </li>
      ))}
    </ul>
  );
}

const open = (name: string): { name: string } => ({ name: `Open ${name}` });

describe('rowList', () => {
  it('moves between rows with J and K and the arrows', async () => {
    const user = userEvent.setup();
    const view = render(<List onOpen={vi.fn()} onRemove={vi.fn()} />);
    view.getByRole('button', open('Peonies')).focus();
    await user.keyboard('j');
    expect(view.getByRole('button', open(SCARF))).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(view.getByRole('button', open('Tickets'))).toHaveFocus();
    await user.keyboard('k');
    expect(view.getByRole('button', open(SCARF))).toHaveFocus();
  });

  it('opens the row with Enter, and deletes it with Delete', async () => {
    const onOpen = vi.fn();
    const onRemove = vi.fn();
    const user = userEvent.setup();
    const view = render(<List onOpen={onOpen} onRemove={onRemove} />);
    view.getByRole('button', open(SCARF)).focus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledWith(SCARF);
    await user.keyboard('{Delete}');
    expect(onRemove).toHaveBeenCalledWith(SCARF);
  });

  it('leaves a field’s letters alone', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    const view = render(<List onOpen={vi.fn()} onRemove={onRemove} />);
    const note = view.getByRole('textbox', { name: 'Note on Peonies' });
    await user.click(note);
    await user.keyboard('jk{Backspace}');
    expect(note).toHaveValue('j');
    expect(note).toHaveFocus();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
