// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './sheet';

const meta: Meta<typeof Sheet> = {
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  render: () => <Sheet>Sheet content</Sheet>,
};
