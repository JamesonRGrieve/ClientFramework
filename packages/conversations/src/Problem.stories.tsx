// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Problem } from './Problem';

const meta: Meta<typeof Problem> = {
  title: 'conversations/Problem',
  component: Problem,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Problem>;

export const SomethingWentWrong: Story = { args: { text: 'The message could not be sent.' } };
