// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PersonPicker } from './PersonPicker';

const ANNE = 'Anne Blunt';
const SOMEONE_NEW = 'Someone new…';

const PEOPLE = [
  { id: 'ada', name: 'Ada Lovelace' },
  { id: 'byron', name: 'George Gordon Byron' },
  { id: 'anne', name: ANNE },
];
const NEW = '__new';

function Harness({ onChange }: { onChange: (value: string) => void }): ReactElement {
  const [value, setValue] = useState('');
  return (
    <PersonPicker
      id='who'
      people={PEOPLE}
      value={value}
      placeholder='Choose someone…'
      extra={{ value: NEW, label: SOMEONE_NEW }}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('PersonPicker', () => {
  it('says to choose someone until someone is chosen', () => {
    render(<Harness onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Choose someone…');
  });

  it('narrows the people by what is typed, and picks one', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('anne');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toContain('ABAnne Blunt');
    expect(screen.queryByRole('option', { name: 'Ada Lovelace' })).toBeNull();
    await user.click(screen.getByRole('option', { name: ANNE }));
    expect(onChange).toHaveBeenLastCalledWith('anne');
    expect(screen.getByRole('combobox')).toHaveTextContent(ANNE);
  });

  it('offers its extra choice above the people', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: SOMEONE_NEW }));
    expect(onChange).toHaveBeenLastCalledWith(NEW);
    expect(screen.getByRole('combobox')).toHaveTextContent(SOMEONE_NEW);
  });
});
