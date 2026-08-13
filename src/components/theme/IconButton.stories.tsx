// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import { LuSun as Sun } from 'react-icons/lu';
import { TooltipProvider } from '@/components/ui/tooltip';
import IconButton from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'Theme/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: {
    Icon: Sun,
    label: 'Light',
    description: 'Switch to light mode',
  },
};
