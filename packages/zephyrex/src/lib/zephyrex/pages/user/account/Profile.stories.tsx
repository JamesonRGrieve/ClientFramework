// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { Profile } from './Profile';
import type { UserProfile } from './profileModel';

const profile: UserProfile = {
  id: '11111111-2222-3333-4444-555555555555',
  email: 'demo@example.com',
  first_name: 'Demo',
  last_name: 'User',
  display_name: 'Demo User',
  username: null,
  timezone: 'America/Edmonton',
  language: 'en',
  updated_at: '2026-10-03T09:00:00.000001',
};

const meta: Meta<typeof Profile> = {
  title: 'zephyrex/Account/Profile',
  component: Profile,
  parameters: {
    nextjs: { appDirectory: true },
    layout: 'centered',
  },
  args: {
    conflict: null,
    onResolve: async () => Promise.resolve(true),
    onDiscard: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof Profile>;

export const Default: Story = {
  args: { profile, onSave: async () => Promise.resolve(true) },
};

export const NewAccount: Story = {
  args: {
    profile: { id: profile.id, email: 'new@example.com' },
    onSave: async () => Promise.resolve(true),
  },
};

export const SaveFails: Story = {
  args: { profile, onSave: async () => Promise.reject(new Error('username: already taken')) },
};

/** Someone else changed the profile after it loaded: the user's edit sits beside theirs. */
export const ChangedElsewhere: Story = {
  args: {
    profile,
    onSave: async () => Promise.resolve(false),
    conflict: { mine: { display_name: 'Demo' }, theirs: { ...profile, display_name: 'D. User' } },
  },
};
