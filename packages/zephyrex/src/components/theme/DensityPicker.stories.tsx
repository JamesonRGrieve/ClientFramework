// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { DensityPicker } from './DensityPicker';

const meta: Meta<typeof DensityPicker> = {
  title: 'Theme/DensityPicker',
  component: DensityPicker,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof DensityPicker>;

/** Comfortable, the default, checked. */
export const Default: Story = {};

/** Choosing compact tightens the whole app: `data-density` lands on <html>. */
export const ChoosesCompact: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('radio', { name: /^Compact/ }));
    await expect(document.documentElement.dataset.density).toBe('compact');
    await userEvent.click(within(canvasElement).getByRole('radio', { name: /^Comfortable/ }));
  },
};
