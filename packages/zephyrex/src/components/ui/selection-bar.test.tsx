// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SelectionBar, useSelection } from './selection-bar';

const IDS = ['g1', 'g2', 'g3'];

function Picker({ onBought }: { onBought: (ids: readonly string[]) => void }): React.JSX.Element {
  const selection = useSelection();
  return (
    <div>
      <button type='button' onClick={() => selection.toggleAll(IDS)}>
        All
      </button>
      {IDS.map((id) => (
        <label key={id}>
          <input type='checkbox' checked={selection.has(id)} onChange={() => selection.toggle(id)} />
          {id}
        </label>
      ))}
      <SelectionBar selection={selection} noun='gift' all={IDS}>
        <button type='button' onClick={() => onBought([...selection.chosen])}>
          Mark bought
        </button>
      </SelectionBar>
    </div>
  );
}

describe('SelectionBar', () => {
  it('appears once rows are ticked, counting them, and acts on them', async () => {
    const bought = vi.fn();
    const user = userEvent.setup();
    const view = render(<Picker onBought={bought} />);
    expect(view.queryByRole('region', { name: 'Chosen' })).toBeNull();
    await user.click(view.getByRole('checkbox', { name: 'g1' }));
    await user.click(view.getByRole('checkbox', { name: 'g3' }));
    expect(view.getByRole('status')).toHaveTextContent('2 gifts chosen');
    await user.click(view.getByRole('button', { name: 'Mark bought' }));
    expect(bought).toHaveBeenCalledWith(['g1', 'g3']);
  });

  it('ticks all, then clears all, and hides when nothing is ticked', async () => {
    const user = userEvent.setup();
    const view = render(<Picker onBought={vi.fn()} />);
    await user.click(view.getByRole('button', { name: 'All' }));
    expect(view.getByRole('status')).toHaveTextContent('3 gifts chosen');
    await user.click(view.getByRole('button', { name: 'All' }));
    expect(view.queryByRole('region', { name: 'Chosen' })).toBeNull();
    await user.click(view.getByRole('checkbox', { name: 'g2' }));
    expect(view.getByRole('status')).toHaveTextContent('1 gift chosen');
    await user.click(view.getByRole('button', { name: 'Clear' }));
    expect(view.queryByRole('region', { name: 'Chosen' })).toBeNull();
  });

  it('offers Choose all beside the count until every row is ticked, apart from the actions', async () => {
    const user = userEvent.setup();
    const view = render(<Picker onBought={vi.fn()} />);
    await user.click(view.getByRole('checkbox', { name: 'g1' }));
    const actions = view.getByRole('group', { name: 'For the chosen' });
    expect(actions).toContainElement(view.getByRole('button', { name: 'Mark bought' }));
    expect(actions).not.toContainElement(view.getByRole('button', { name: 'Clear' }));
    await user.click(view.getByRole('button', { name: 'Choose all' }));
    expect(view.getByRole('status')).toHaveTextContent('3 gifts chosen');
    expect(view.queryByRole('button', { name: 'Choose all' })).toBeNull();
  });
});
