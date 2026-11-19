// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { ChoiceChip } from './choice-chip';
import { chipGroup } from '@/hooks/chipKeys';

const meta: Meta<typeof ChoiceChip> = {
  title: 'UI/ChoiceChip',
  component: ChoiceChip,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof ChoiceChip>;

const CHIP =
  'rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted aria-checked:border-primary aria-checked:bg-primary/10 aria-checked:text-foreground';

/** Gender on a person: one at most, and choosing the chosen one again clears it. */
export const OneOrNone: Story = {
  render: () => {
    const [gender, setGender] = useState('');
    return (
      <div role='radiogroup' aria-label='Gender' ref={chipGroup} className='flex flex-wrap gap-1.5'>
        {['Woman', 'Man', 'Non-binary', 'Other'].map((choice) => (
          <ChoiceChip
            key={choice}
            checked={gender === choice}
            onClick={() => setGender(gender === choice ? '' : choice)}
            className={CHIP}
          >
            {choice}
          </ChoiceChip>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const man = canvas.getByRole('radio', { name: 'Man' });
    await userEvent.click(man);
    await expect(man).toBeChecked();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Non-binary' })).toHaveFocus();
  },
};
