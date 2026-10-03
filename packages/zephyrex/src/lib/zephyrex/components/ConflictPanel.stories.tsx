// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { ConflictPanel } from './ConflictPanel';

interface Team {
  name: string;
  description: string | null;
  updated_at: string;
}

const meta: Meta<typeof ConflictPanel<Team>> = {
  title: 'Zephyrex/ConflictPanel',
  component: ConflictPanel<Team>,
  args: {
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
    ],
    onResolve: fn(),
    onDiscard: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof ConflictPanel<Team>>;

const theirs: Team = { name: 'Platform', description: 'Runs the build fleet', updated_at: '2026-10-03T18:00:00.000001' };

export const ChangedFields: Story = {
  args: { conflict: { mine: { name: 'Platform team', description: null }, theirs } },
};

export const NoFieldsToCompare: Story = {
  args: { conflict: { mine: {}, theirs }, fields: [], applyLabel: 'Revoke anyway' },
};

export const Removed: Story = {
  args: { conflict: { mine: { name: 'Platform team' }, theirs: null } },
};
