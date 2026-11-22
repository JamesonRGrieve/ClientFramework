// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import type { ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { AppDrawerProvider, useAppDrawer } from './AppDrawer';
import { Button } from '@/components/ui/button';

function Findings(): ReactNode {
  return (
    <div className='grid gap-3 text-sm'>
      <ul className='list-disc pl-5'>
        <li>The Koronus Expanse map names a moon the gazetteer doesn’t.</li>
        <li>Two NPCs share a ship.</li>
      </ul>
      <Button type='button' variant='outline' size='sm'>
        Permanently dismiss canon warnings for this campaign
      </Button>
    </div>
  );
}

function DetailsButton(): ReactNode {
  const drawer = useAppDrawer();
  return (
    <Button type='button' onClick={() => drawer.open(<Findings />, 'Canon notes', 'Where this campaign differs from the books.')}>
      Details
    </Button>
  );
}

const meta: Meta<typeof DetailsButton> = {
  title: 'AppWrapper/AppDrawer',
  component: DetailsButton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <AppDrawerProvider>
        <Story />
      </AppDrawerProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DetailsButton>;

/** "Details" pulls the drawer up from the bottom with the findings and an action inside. */
export const PullsUp: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Details' }));
    const drawer = await within(document.body).findByRole('dialog', { name: 'Canon notes' });
    await expect(within(drawer).getByRole('button', { name: /Permanently dismiss/ })).toBeInTheDocument();
  },
};
