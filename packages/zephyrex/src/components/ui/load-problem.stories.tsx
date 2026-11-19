// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { LoadProblem } from './load-problem';

const meta: Meta<typeof LoadProblem> = {
  title: 'UI/LoadProblem',
  component: LoadProblem,
  tags: ['autodocs'],
  args: { what: 'your gift list', error: new Error('The server did not answer.') },
};

export default meta;
type Story = StoryObj<typeof LoadProblem>;

/** With a way to load again: the usual case. */
export const WithRetry: Story = {
  args: { onRetry: fn(() => Promise.resolve()) },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Your gift list could not be loaded.');
    await userEvent.click(canvas.getByRole('button', { name: /Try again/ }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};

/** No way to load again (a value handed down, not fetched here): no button. */
export const WithoutRetry: Story = {};

/** No reason from the server: the sentence alone. */
export const NoReason: Story = {
  args: { error: undefined, what: 'the network' },
};
