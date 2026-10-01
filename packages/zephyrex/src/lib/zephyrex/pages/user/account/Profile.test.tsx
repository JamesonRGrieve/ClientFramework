// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Profile } from './Profile';
import type { UserProfile } from './profileModel';

const SAVE = 'Save profile';

const profile: UserProfile = {
  id: 'u1',
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  timezone: 'Europe/London',
};

describe('Profile', () => {
  it('shows who is signed in and saves only what changed', async () => {
    const onSave = vi.fn(async () => Promise.resolve());
    const user = userEvent.setup();
    const view = render(<Profile profile={profile} onSave={onSave} />);
    expect(view.getByText('ada@example.com')).toBeInTheDocument();

    const lastName = view.getByLabelText('Last name');
    await user.clear(lastName);
    await user.type(lastName, 'Byron');
    await user.click(view.getByRole('button', { name: SAVE }));

    expect(onSave).toHaveBeenCalledWith({ last_name: 'Byron' });
    expect(await view.findByRole('status')).toHaveTextContent('Profile saved.');
  });

  it('does not call the server when nothing changed', async () => {
    const onSave = vi.fn(async () => Promise.resolve());
    const user = userEvent.setup();
    const view = render(<Profile profile={profile} onSave={onSave} />);
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(onSave).not.toHaveBeenCalled();
    expect(view.getByRole('status')).toHaveTextContent('Nothing to save.');
  });

  it('reports the server’s reason when saving fails', async () => {
    const onSave = vi.fn(async () => Promise.reject(new Error('username: already taken')));
    const user = userEvent.setup();
    const view = render(<Profile profile={profile} onSave={onSave} />);
    await user.type(view.getByLabelText('Username'), 'ada');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('alert')).toHaveTextContent('username: already taken');
  });

  it('holds the form while a save is in flight', async () => {
    let finish: () => void = () => undefined;
    const onSave = vi.fn(async () => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
    });
    const user = userEvent.setup();
    const view = render(<Profile profile={profile} onSave={onSave} />);
    await user.type(view.getByLabelText('Username'), 'ada');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(view.getByRole('button', { name: SAVE })).toBeDisabled();
    expect(view.getByLabelText('Username')).toBeDisabled();
    finish();
    expect(await view.findByRole('status')).toHaveTextContent('Profile saved.');
    expect(view.getByRole('button', { name: SAVE })).toBeEnabled();
  });
});
