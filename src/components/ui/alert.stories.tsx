// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => <Alert>Alert content</Alert>,
};
