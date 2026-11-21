// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { ThemeSettings } from './ThemeSettingsPage';

// The page's body; the page itself reads the theme cookie on the server.
const meta: Meta<typeof ThemeSettings> = {
  title: 'pages/settings/ThemeSettings',
  component: ThemeSettings,
  args: { theme: 'light' },
};
export default meta;

type Story = StoryObj<typeof ThemeSettings>;

/** The four themes, light chosen. */
export const Light: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('radio', { name: 'Light' })).toBeChecked();
  },
};

/** Dark chosen. */
export const Dark: Story = { args: { theme: 'dark' } };

/** With an app's own theme and its other settings below. */
export const WithAppSettings: Story = {
  args: { theme: 'sepia', customThemes: ['sepia'], children: <p className='text-sm'>Reading speed: 140 words a minute</p> },
};
