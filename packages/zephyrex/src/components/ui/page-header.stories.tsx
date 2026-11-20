// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { Button } from './button';
import { PageHeader } from './page-header';

const meta: Meta<typeof PageHeader> = {
  title: 'ui/PageHeader',
  component: PageHeader,
  parameters: { layout: 'padded' },
  args: { title: 'People', description: 'Everyone you have recorded.' },
};
export default meta;

type Story = StoryObj<typeof PageHeader>;

export const TitleOnly: Story = { args: { description: undefined } };

export const WithAction: Story = {
  args: { actions: <Button>Add person</Button>, meta: '7 people' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'People' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Add person' })).toBeInTheDocument();
  },
};
