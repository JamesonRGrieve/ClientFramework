// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';

import { Section } from './Section';

const meta: Meta<typeof Section> = {
  title: 'marketing/Section',
  component: Section,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  args: {
    id: 'features',
    title: 'Features',
    eyebrow: 'What you get',
    intro: 'Everything in one place.',
    children: <p>Section body</p>,
  },
};
export default meta;
type Story = StoryObj<typeof Section>;

export const WithEyebrow: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('region', { name: 'Features' })).toHaveTextContent('Section body');
  },
};
