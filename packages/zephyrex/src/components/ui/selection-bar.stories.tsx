// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { useEffect } from 'react';
import { expect, within } from 'storybook/test';
import { Button } from './button';
import { SelectionBar, useSelection } from './selection-bar';

function Chosen({ ids }: { ids: readonly string[] }): React.JSX.Element {
  const selection = useSelection();
  const { toggleAll } = selection;
  useEffect(() => {
    toggleAll(ids);
  }, [ids, toggleAll]);
  return (
    <SelectionBar selection={selection} noun='gift'>
      <Button type='button' size='sm' variant='outline'>
        Mark bought
      </Button>
    </SelectionBar>
  );
}

const meta: Meta<typeof Chosen> = {
  title: 'ui/SelectionBar',
  component: Chosen,
  parameters: { layout: 'padded' },
  args: { ids: ['g1', 'g2'] },
};
export default meta;

type Story = StoryObj<typeof Chosen>;

/** Two rows ticked: the count, the action, and Clear. */
export const TwoChosen: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('status')).toHaveTextContent('2 gifts chosen');
  },
};

/** One row: the noun stays singular. */
export const OneChosen: Story = { args: { ids: ['g1'] } };
