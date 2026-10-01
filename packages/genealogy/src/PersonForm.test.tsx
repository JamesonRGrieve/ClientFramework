// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PersonForm } from './PersonForm';

describe('PersonForm', () => {
  it('saves the details as the server takes them, blanks as null', async () => {
    const onSave = vi.fn(async () => Promise.resolve(null));
    const user = userEvent.setup();
    const view = render(<PersonForm submitLabel='Add person' onSave={onSave} />);
    await user.type(view.getByLabelText('Name'), '  Medora Leigh ');
    await user.type(view.getByLabelText('Born'), '1814-04-15');
    await user.click(view.getByRole('button', { name: 'Add person' }));
    expect(onSave).toHaveBeenCalledWith({
      name: 'Medora Leigh',
      birth_date: '1814-04-15',
      death_date: null,
      gender: null,
      description: null,
    });
  });

  it('starts from the person being edited', () => {
    const view = render(
      <PersonForm
        person={{ name: 'Ada', birth_date: '1815-12-10T00:00:00', death_date: null, gender: 'female', description: null }}
        submitLabel='Save'
        onSave={async () => Promise.resolve(null)}
      />,
    );
    expect(view.getByLabelText('Name')).toHaveValue('Ada');
    expect(view.getByLabelText('Born')).toHaveValue('1815-12-10');
    expect(view.getByLabelText('Gender')).toHaveValue('female');
  });

  it('refuses a death before the birth, and shows why a save failed', async () => {
    const onSave = vi.fn(async () => Promise.resolve('Name is too long'));
    const user = userEvent.setup();
    const view = render(<PersonForm submitLabel='Save' onSave={onSave} />);
    await user.type(view.getByLabelText('Born'), '1900-01-01');
    await user.type(view.getByLabelText('Died'), '1899-01-01');
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(view.getByRole('alert')).toHaveTextContent('before the date of birth');
    expect(onSave).not.toHaveBeenCalled();
    await user.clear(view.getByLabelText('Died'));
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(await view.findByRole('alert')).toHaveTextContent('Name is too long');
  });
});
