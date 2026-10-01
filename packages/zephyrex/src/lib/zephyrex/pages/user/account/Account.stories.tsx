// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Account } from './Account';

const meta: Meta<typeof Account> = {
  title: 'zephyrex/Account/Password',
  component: Account,
  parameters: {
    nextjs: { appDirectory: true },
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof Account>;

const policy = { min_length: 8, max_bytes: 72, require_letter: true, require_digit: true };

export const Default: Story = {
  args: {
    onChangePassword: async () => Promise.resolve('Password changed successfully'),
    passwordPolicy: policy,
  },
};

export const PolicyStillLoading: Story = {
  args: {
    onChangePassword: async () => Promise.resolve('Password changed successfully'),
    passwordPolicy: undefined,
  },
};

export const WrongCurrentPassword: Story = {
  args: {
    onChangePassword: async () => Promise.reject(new Error('Current password is incorrect')),
    passwordPolicy: policy,
  },
};
