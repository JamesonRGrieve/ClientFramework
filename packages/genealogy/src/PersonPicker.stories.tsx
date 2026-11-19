// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { PersonPicker } from './PersonPicker';

const meta: Meta<typeof PersonPicker> = {
  title: 'genealogy/PersonPicker',
  component: PersonPicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof PersonPicker>;

const ADA = 'Ada Lovelace';

const PEOPLE = [
  { id: 'ada', name: ADA },
  { id: 'byron', name: 'George Gordon Byron' },
  { id: 'anne', name: 'Anne Blunt' },
];

export const ChooseSomeone: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className='w-72'>
        <PersonPicker
          id='who'
          people={PEOPLE}
          value={value}
          placeholder='Choose someone…'
          extra={{ value: '__new', label: 'Someone new…' }}
          onChange={setValue}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.keyboard('ada');
    await userEvent.click(within(document.body).getByRole('option', { name: ADA }));
    await expect(canvas.getByRole('combobox')).toHaveTextContent(ADA);
  },
};
