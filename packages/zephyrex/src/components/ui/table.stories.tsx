// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Table } from './table';

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => <Table>Table content</Table>,
};
