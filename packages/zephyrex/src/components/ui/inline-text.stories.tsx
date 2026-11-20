// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { InlineText } from './inline-text';

const EDIT = { name: 'Gift title: Peonies. Edit' };

const meta: Meta<typeof InlineText> = {
  title: 'ui/InlineText',
  component: InlineText,
  parameters: { layout: 'padded' },
  args: { value: 'Peonies', label: 'Gift title', onSave: fn(() => Promise.resolve(null)) },
};
export default meta;

type Story = StoryObj<typeof InlineText>;

export const AtRest: Story = {};

/** Pressed: the text becomes a field holding it. */
export const Editing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', EDIT));
    await expect(canvas.getByRole('textbox', { name: 'Gift title' })).toHaveValue('Peonies');
  },
};

/** Nothing written yet: the placeholder stands in. */
export const Empty: Story = { args: { value: '', placeholder: 'Add a note' } };
