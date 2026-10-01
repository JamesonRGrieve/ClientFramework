// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
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
};

const meta: Meta<typeof Profile> = {
  title: 'zephyrex/Account/Profile',
  component: Profile,
  parameters: {
    nextjs: { appDirectory: true },
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof Profile>;

export const Default: Story = {
  args: { profile, onSave: async () => Promise.resolve() },
};

export const NewAccount: Story = {
  args: {
    profile: { id: profile.id, email: 'new@example.com' },
    onSave: async () => Promise.resolve(),
  },
};

export const SaveFails: Story = {
  args: { profile, onSave: async () => Promise.reject(new Error('username: already taken')) },
};
