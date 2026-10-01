// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Latex } from './Latex';

const meta: Meta<typeof Latex> = {
  title: 'markdown/Latex',
  component: Latex,
};
export default meta;

type Story = StoryObj<typeof Latex>;

export const InlineAndDisplay: Story = {
  args: { children: 'The area of a circle is $\\pi r^2$, and $$\\int_0^1 x^2\\,dx = \\tfrac{1}{3}$$' },
};

export const BadInput: Story = {
  args: { children: 'An unfinished fraction: $\\frac{1}{$' },
};
