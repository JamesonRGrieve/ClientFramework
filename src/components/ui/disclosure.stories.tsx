// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from 'storybook/test';
import { Disclosure, DisclosureContent, DisclosureTrigger } from './disclosure';

const meta: Meta<typeof Disclosure> = {
  title: 'UI/Disclosure',
  component: Disclosure,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Disclosure>;

export const Default: Story = {
  render: () => (
    <Disclosure>
      <DisclosureTrigger>
        <span>Show details</span>
      </DisclosureTrigger>
      <DisclosureContent>The details, revealed.</DisclosureContent>
    </Disclosure>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Show details' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(await canvas.findByText('The details, revealed.')).toBeVisible();
  },
};
