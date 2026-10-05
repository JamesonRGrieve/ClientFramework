// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { ADA, CHARLES } from './conversations.mocks';
import { PersonPicker } from './PersonPicker';

const meta: Meta<typeof PersonPicker> = {
  title: 'conversations/PersonPicker',
  component: PersonPicker,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof PersonPicker>;

function Picking({ initial }: { initial: string | null }): ReturnType<typeof PersonPicker> {
  const [value, setValue] = useState(initial);
  return <PersonPicker label='Message' people={[ADA, CHARLES]} value={value} onChange={setValue} />;
}

export const NobodyYet: Story = { render: () => <Picking initial={null} /> };

export const Chosen: Story = { render: () => <Picking initial={CHARLES.id} /> };
