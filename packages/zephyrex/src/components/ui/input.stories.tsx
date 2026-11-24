// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Hello',
  },
};

/** Date and time fields: the picker icon sits at the field's right edge, not just after the value. */
export const DateAndTime: Story = {
  render: () => (
    <div className='grid w-96 gap-3'>
      <Input type='date' aria-label='Starting' defaultValue='2026-11-24' />
      <Input type='time' aria-label='From' defaultValue='18:00' />
      <Input type='datetime-local' aria-label='When' defaultValue='2026-11-24T18:00' />
    </div>
  ),
};
