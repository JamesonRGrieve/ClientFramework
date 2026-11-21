// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Profile } from './Profile';
import { detectTimezone, type UserProfile } from './profileModel';

const SAVED = 'Saved';
const CHANGE_USERNAME = 'Change username';
const FIRST_NAME = 'First name';
const DISPLAY_NAME = 'Display name';
const USERNAME = 'Username';
const NICKNAME = 'Ada L.';
/** A version after the profile's own, as a newer save or someone else's write leaves it. */
const LATER = '2026-10-03T09:05:00.000002';

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
  it('shows who is signed in and saves a name as its box is left, and only what changed', async () => {
    const onSave = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    expect(view.getByText('ada@example.com')).toBeInTheDocument();
    expect(view.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();

    const lastName = view.getByLabelText('Last name');
    await user.clear(lastName);
    await user.type(lastName, 'Byron');
    await user.tab();

    expect(onSave).toHaveBeenCalledWith(profile, { last_name: 'Byron' });
    expect(await view.findByRole('status')).toHaveTextContent(SAVED);
  });

  it('saves nothing when a box is left unchanged', async () => {
    const onSave = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    await user.click(view.getByLabelText(FIRST_NAME));
    await user.tab();
    expect(onSave).not.toHaveBeenCalled();
    expect(view.getByRole('status')).toHaveTextContent('');
  });

  it('saves over the profile the form was filled from, even after a newer one arrives', async () => {
    const onSave = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    const newer: UserProfile = { ...profile, first_name: 'Augusta', updated_at: LATER };
    view.rerender(<Profile profile={newer} onSave={onSave} conflict={null} onResolve={vi.fn(saved)} onDiscard={vi.fn()} />);
    expect(view.getByLabelText(FIRST_NAME)).toHaveValue('Ada');
    await user.type(view.getByLabelText(DISPLAY_NAME), NICKNAME);
    await user.tab();
    expect(onSave).toHaveBeenCalledWith(profile, { display_name: NICKNAME });
  });

  it('saves one change at a time, the next over the profile the first one stored', async () => {
    let finish: () => void = () => undefined;
    const onSave = vi.fn(async (): Promise<boolean> => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return true;
    });
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    await user.type(view.getByLabelText(DISPLAY_NAME), NICKNAME);
    await user.tab();
    expect(view.getByRole('status')).toHaveTextContent('Saving…');
    const firstName = view.getByLabelText(FIRST_NAME);
    await user.clear(firstName);
    await user.type(firstName, 'Augusta');
    await user.tab();
    expect(onSave).toHaveBeenCalledOnce();

    finish();
    const stored: UserProfile = { ...profile, display_name: NICKNAME, updated_at: LATER };
    await waitFor(() => expect(view.getByRole('status')).toHaveTextContent(SAVED));
    view.rerender(<Profile profile={stored} onSave={onSave} conflict={null} onResolve={vi.fn(saved)} onDiscard={vi.fn()} />);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave).toHaveBeenLastCalledWith(stored, { first_name: 'Augusta' });
    expect(view.getByLabelText(FIRST_NAME)).toHaveValue('Augusta');
    expect(view.getByLabelText(DISPLAY_NAME)).toHaveValue(NICKNAME);
  });

  it('changes the username only when its button is pressed', async () => {
    const onSave = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    expect(view.getByRole('button', { name: CHANGE_USERNAME })).toBeDisabled();
    await user.type(view.getByLabelText(USERNAME), 'ada');
    await user.tab();
    expect(onSave).not.toHaveBeenCalled();

    await user.click(view.getByRole('button', { name: CHANGE_USERNAME }));
    expect(onSave).toHaveBeenCalledWith(profile, { username: 'ada' });
    expect(await view.findByRole('status')).toHaveTextContent('Username changed.');
  });

  it('offers the device’s timezone when none is set, and records it only when chosen', async () => {
    const onSave = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ profile: { ...profile, timezone: null }, onSave });
    expect(onSave).not.toHaveBeenCalled();
    await user.click(view.getByRole('button', { name: `Use this device’s timezone (${detectTimezone()})` }));
    expect(onSave).toHaveBeenCalledWith({ ...profile, timezone: null }, { timezone: detectTimezone() });
  });

  it('offers languages by their own names, not a free-text box', () => {
    const view = renderProfile({ profile: { ...profile, language: 'fr' }, onSave: vi.fn(saved) });
    expect(view.getByLabelText('Language')).toHaveTextContent('Français');
  });

  it('reports the server’s reason when saving fails', async () => {
    const onSave = vi.fn(async () => Promise.reject(new Error('username: already taken')));
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    await user.type(view.getByLabelText(USERNAME), 'ada');
    await user.click(view.getByRole('button', { name: CHANGE_USERNAME }));
    expect(await view.findByRole('alert')).toHaveTextContent('username: already taken');
  });

  it('says nothing was saved when someone changed the profile first, and shows the conflict to resolve', async () => {
    const onSave = vi.fn(async () => Promise.resolve(false));
    const onResolve = vi.fn(saved);
    const user = userEvent.setup();
    const view = renderProfile({ onSave });
    await user.type(view.getByLabelText(USERNAME), 'ada');
    await user.click(view.getByRole('button', { name: CHANGE_USERNAME }));
    expect(onSave).toHaveBeenCalledOnce();
    await waitFor(() => expect(view.getByRole('status')).toHaveTextContent(''));

    const current: UserProfile = { ...profile, username: 'countess', updated_at: LATER };
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
