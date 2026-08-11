// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import SwitchDark from './SwitchDark';

const meta: Meta<typeof SwitchDark> = {
  title: 'Theme/SwitchDark',
  component: SwitchDark,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SwitchDark>;

export const Default: Story = {};
