// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { ThemePicker } from './ThemePicker';

const meta: Meta<typeof ThemePicker> = {
  title: 'zephyrex/Theme/ThemePicker',
  component: ThemePicker,
  parameters: { layout: 'padded' },
  args: { initialTheme: 'light' },
};
export default meta;

type Story = StoryObj<typeof ThemePicker>;

export const Default: Story = {};

/** Choosing a theme marks it and applies it to the page. */
export const ChooseDark: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Dark' }));
    await expect(canvas.getByRole('radio', { name: 'Dark' })).toBeChecked();
  },
};
