// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

const meta: Meta<typeof Accordion> = {
  title: 'UI/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

const items = (
  <>
    <AccordionItem value='shipping'>
      <AccordionTrigger>Shipping</AccordionTrigger>
      <AccordionContent>Orders ship within two business days.</AccordionContent>
    </AccordionItem>
    <AccordionItem value='returns'>
      <AccordionTrigger>Returns</AccordionTrigger>
      <AccordionContent>Return anything within 30 days.</AccordionContent>
    </AccordionItem>
  </>
);

export const Default: Story = {
  render: () => <Accordion>{items}</Accordion>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Shipping' }));
    await expect(canvas.getByRole('region', { name: 'Shipping' })).toBeVisible();
  },
};

export const Multiple: Story = {
  render: () => <Accordion type='multiple'>{items}</Accordion>,
};
