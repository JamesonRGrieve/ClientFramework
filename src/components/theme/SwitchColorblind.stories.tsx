// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import StyledSwitch from './SwitchColorblind';

const meta: Meta<typeof StyledSwitch> = {
  title: 'Theme/SwitchColorblind',
  component: StyledSwitch,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StyledSwitch>;

export const Default: Story = {};
