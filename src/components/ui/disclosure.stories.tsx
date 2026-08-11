// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import { Disclosure, DisclosureTrigger, DisclosureContent } from './disclosure';

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
      Disclosure content
    </Disclosure>
  ),
};
