// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Profile } from './Profile';
import { detectTimezone, type UserProfile } from './profileModel';

const SAVE = 'Save profile';
const SAVED = 'Profile saved.';

const profile: UserProfile = {
  id: 'u1',
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  timezone: 'Europe/London',
  updated_at: '2026-10-03T09:00:00.000001',
};

const saved = async (): Promise<boolean> => Promise.resolve(true);

const renderProfile = (props: Partial<ComponentProps<typeof Profile>> & Pick<ComponentProps<typeof Profile>, 'onSave'>) =>
  render(<Profile profile={profile} conflict={null} onResolve={vi.fn(saved)} onDiscard={vi.fn()} {...props} />);

describe('Profile', () => {
  it('shows who is signed in and saves only what changed', async () => {
    const onSave = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    expect(view.getByText('ada@example.com')).toBeInTheDocument();

    const lastName = view.getByLabelText('Last name');
    await user.clear(lastName);
    await user.type(lastName, 'Byron');
    await user.click(view.getByRole('button', { name: SAVE }));

    expect(onSave).toHaveBeenCalledWith(profile, { last_name: 'Byron' });
    expect(await view.findByRole('status')).toHaveTextContent(SAVED);
  });

  it('saves over the profile the form was filled from, even after a newer one arrives', async () => {
    const onSave = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    const newer: UserProfile = { ...profile, first_name: 'Augusta', updated_at: '2026-10-03T09:05:00.000002' };
    view.rerender(<Profile profile={newer} onSave={onSave} conflict={null} onResolve={vi.fn(saved)} onDiscard={vi.fn()} />);
    expect(view.getByLabelText('First name')).toHaveValue('Ada');
    await user.type(view.getByLabelText('Username'), 'ada');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(onSave).toHaveBeenCalledWith(profile, { username: 'ada' });
  });

  it('does not call the server when nothing changed', async () => {
    const onSave = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(onSave).not.toHaveBeenCalled();
    expect(view.getByRole('status')).toHaveTextContent('Nothing to save.');
  });

  it('suggests the browser’s timezone when none is set, and records it only when saved', async () => {
    const onSave = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ profile: { ...profile, timezone: null }, onSave });
    expect(view.getByLabelText('Timezone')).toHaveTextContent(detectTimezone());
    expect(onSave).not.toHaveBeenCalled();
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(onSave).toHaveBeenCalledWith({ ...profile, timezone: null }, { timezone: detectTimezone() });
  });

  it('reports the server’s reason when saving fails', async () => {
    const onSave = vi.fn(async () => Promise.reject(new Error('username: already taken')));
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    await user.type(view.getByLabelText('Username'), 'ada');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(await view.findByRole('alert')).toHaveTextContent('username: already taken');
  });

  it('holds the form while a save is in flight', async () => {
    let finish: () => void = () => undefined;
    const onSave = vi.fn(async (): Promise<boolean> => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return true;
    });
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    await user.type(view.getByLabelText('Username'), 'ada');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(view.getByRole('button', { name: SAVE })).toBeDisabled();
    expect(view.getByLabelText('Username')).toBeDisabled();
    finish();
    expect(await view.findByRole('status')).toHaveTextContent(SAVED);
    expect(view.getByRole('button', { name: SAVE })).toBeEnabled();
  });

  it('says nothing was saved when someone changed the profile first, and shows the conflict to resolve', async () => {
    const onSave = vi.fn(async () => Promise.resolve(false));
    const onResolve = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    await user.type(view.getByLabelText('Username'), 'ada');
    await user.click(view.getByRole('button', { name: SAVE }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(view.queryByRole('status')).not.toBeInTheDocument();

    const current: UserProfile = { ...profile, username: 'countess', updated_at: '2026-10-03T09:05:00.000002' };
    view.rerender(
      <Profile
        profile={profile}
        onSave={onSave}
        conflict={{ mine: { username: 'ada' }, theirs: current }}
        onResolve={onResolve}
        onDiscard={vi.fn()}
      />,
    );
    expect(view.getByRole('radio', { name: 'Current: countess' })).toBeInTheDocument();
    await user.click(view.getByRole('button', { name: 'Save merged' }));
    expect(onResolve).toHaveBeenCalledWith({ username: 'ada' });
    expect(await view.findByRole('status')).toHaveTextContent(SAVED);
  });
});
