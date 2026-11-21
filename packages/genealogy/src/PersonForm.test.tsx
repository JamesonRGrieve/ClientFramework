// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PersonForm } from './PersonForm';

const GENDER_WORDS = 'Gender, in their words';

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
    expect(within(view.getByRole('radiogroup', { name: 'Gender' })).getByRole('radio', { name: 'Female' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('offers Male, Female, Nonbinary and Other, asking for words only for Other', async () => {
    const onSave = vi.fn(async () => Promise.resolve(null));
    const user = userEvent.setup();
    const view = render(<PersonForm submitLabel='Save' onSave={onSave} />);
    const gender = view.getByRole('radiogroup', { name: 'Gender' });
    expect(
      within(gender)
        .getAllByRole('radio')
        .map((option) => option.textContent),
    ).toEqual(['Not recorded', 'Male', 'Female', 'Nonbinary', 'Other']);
    expect(view.queryByLabelText(GENDER_WORDS)).toBeNull();
    await user.click(within(gender).getByRole('radio', { name: 'Nonbinary' }));
    expect(view.queryByLabelText(GENDER_WORDS)).toBeNull();
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ gender: 'nonbinary' }));
    await user.click(within(gender).getByRole('radio', { name: 'Other' }));
    await user.type(view.getByLabelText(GENDER_WORDS), 'Genderfluid');
    await user.click(view.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ gender: 'Genderfluid' }));
  });

  it('shows a gender stored in other words as Other, with the words kept', () => {
    const view = render(
      <PersonForm
        person={{ name: 'Kai', birth_date: null, death_date: null, gender: 'Two-spirit', description: null }}
        submitLabel='Save'
        onSave={async () => Promise.resolve(null)}
      />,
    );
    expect(within(view.getByRole('radiogroup', { name: 'Gender' })).getByRole('radio', { name: 'Other' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(view.getByLabelText(GENDER_WORDS)).toHaveValue('Two-spirit');
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

  it('with autosave, saves a field as it is left and a gender as it is picked, and nothing unchanged', async () => {
    const onSave = vi.fn(async () => Promise.resolve(null));
    const user = userEvent.setup();
    const view = render(
      <PersonForm
        person={{ name: 'Ada', birth_date: null, death_date: null, gender: null, description: null }}
        submitLabel='Save'
        autosave
        onSave={onSave}
      />,
    );
    expect(view.queryByRole('button', { name: 'Save' })).toBeNull();
    await user.click(view.getByLabelText('Name'));
    await user.tab();
    expect(onSave).not.toHaveBeenCalled();
    await user.type(view.getByLabelText('Name'), ' King');
    await user.tab();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Ada King' }));
    expect(await view.findByText('Saved')).toBeInTheDocument();
    await user.click(view.getByRole('radio', { name: 'Female' }));
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Ada King', gender: 'female' }));
  });
});
