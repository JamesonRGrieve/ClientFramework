// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './input-otp';

const meta: Meta<typeof InputOTP> = {
  title: 'UI/InputOTP',
  component: InputOTP,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InputOTP>;

export const Default: Story = {
  render: () => (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
      </InputOTPGroup>
    </InputOTP>
  ),
};
