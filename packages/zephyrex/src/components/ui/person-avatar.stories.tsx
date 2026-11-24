// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { PersonAvatar } from './person-avatar';
import { personTones } from './person-tone';

const meta: Meta<typeof PersonAvatar> = {
  title: 'UI/PersonAvatar',
  component: PersonAvatar,
  args: { id: 'u-ada', name: 'Ada Lovelace' },
};
export default meta;

type Story = StoryObj<typeof PersonAvatar>;

/** One person, in their own colour. */
export const Default: Story = {};

const PEOPLE = [
  { id: 'u-you', name: 'You' },
  { id: 'u-alex', name: 'Alex Chen' },
  { id: 'u-jo', name: 'Jo Park' },
  { id: 'u-sam', name: 'Sam Rivera' },
];

/** A view of a few people: personTones keeps any two from sharing a colour. */
export const AView: Story = {
  render: () => {
    const tones = personTones(PEOPLE.map((person) => person.id));
    return (
      <div className='flex gap-2'>
        {PEOPLE.map((person) => (
          <PersonAvatar key={person.id} id={person.id} name={person.name} tone={tones.get(person.id)} size='md' />
        ))}
      </div>
    );
  },
};
