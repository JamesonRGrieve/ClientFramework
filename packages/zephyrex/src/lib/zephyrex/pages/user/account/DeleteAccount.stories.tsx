// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { DeleteAccount } from './DeleteAccount';

const meta: Meta<typeof DeleteAccount> = {
  title: 'zephyrex/Account/DeleteAccount',
  component: DeleteAccount,
  parameters: { nextjs: { appDirectory: true }, layout: 'centered' },
  args: { onDelete: async () => Promise.resolve() },
};
export default meta;

type Story = StoryObj<typeof DeleteAccount>;

export const Default: Story = {};

export const AppNote: Story = {
  args: { note: 'Everything you published leaves with you, and your own tree is erased.' },
};

export const Refused: Story = {
  args: { onDelete: async () => Promise.reject(new Error('Your data could not all be erased, so your account was kept.')) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Type “delete” to confirm'), 'delete');
    await userEvent.click(canvas.getByRole('button', { name: 'Delete my account' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent('kept');
  },
};
