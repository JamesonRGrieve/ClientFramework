// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { PersonForm } from './PersonForm';

const meta: Meta<typeof PersonForm> = {
  title: 'genealogy/PersonForm',
  component: PersonForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { onSave: async () => Promise.resolve(null) },
};
export default meta;

type Story = StoryObj<typeof PersonForm>;

export const NewPerson: Story = { args: { submitLabel: 'Add person' } };

export const Editing: Story = {
  args: {
    submitLabel: 'Save',
    person: {
      name: 'Ada Lovelace',
      birth_date: '1815-12-10T00:00:00',
      death_date: '1852-11-27T00:00:00',
      gender: 'female',
      description: 'Mathematician',
    },
  },
};
