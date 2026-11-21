// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, fn, within } from 'storybook/test';
import { FilePicker } from './FilePicker';

const meta: Meta<typeof FilePicker> = {
  title: 'attachments/FilePicker',
  component: FilePicker,
  args: { label: 'Add a file', onFile: fn(async () => Promise.resolve()) },
};
export default meta;

type Story = StoryObj<typeof FilePicker>;

/** Ready to choose a picture or a PDF. */
export const Ready: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Add a file' })).toBeEnabled();
  },
};

/** Part-way through an upload. */
export const Uploading: Story = {
  args: { uploading: true, progress: { loaded: 3, total: 10, percent: 30 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Uploading…' })).toBeDisabled();
    await expect(canvas.getByRole('progressbar')).toBeInTheDocument();
  },
};

/** The last upload failed. */
export const Failed: Story = {
  args: { error: new Error('Upload failed: 413 Payload Too Large') },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('Upload failed: 413');
  },
};

/** Not available to this user. */
export const Disabled: Story = {
  args: { disabled: true },
};
