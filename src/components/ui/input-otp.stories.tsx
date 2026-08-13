// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './input-otp';

const meta: Meta<typeof InputOTP> = {
  title: 'UI/InputOTP',
  component: InputOTP,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InputOTP>;

export const Default: Story = {
  render: () => <InputOTP>InputOTP content</InputOTP>,
};
