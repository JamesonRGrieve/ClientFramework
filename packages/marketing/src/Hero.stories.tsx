// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, within } from 'storybook/test';
import { Hero } from './Hero';
import { CTA } from './marketing.mocks';

const meta: Meta<typeof Hero> = {
  title: 'marketing/Hero',
  component: Hero,
  parameters: { nextjs: { appDirectory: true }, layout: 'padded' },
  args: {
    title: 'Your table, anywhere',
    lead: 'A short promise.',
    primary: CTA,
    secondary: { label: 'See features', href: '/features' },
    sample: <figure className='rounded-2xl border p-6'>A live sample</figure>,
  },
};
export default meta;
type Story = StoryObj<typeof Hero>;

export const WithSample: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Your table, anywhere' })).toBeInTheDocument();
    await expect(canvas.getByText('A live sample')).toBeInTheDocument();
  },
};
