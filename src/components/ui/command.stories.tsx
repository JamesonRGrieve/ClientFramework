// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './command';

const meta: Meta<typeof Command> = {
  title: 'UI/Command',
  component: Command,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => <Command>Command content</Command>,
};
