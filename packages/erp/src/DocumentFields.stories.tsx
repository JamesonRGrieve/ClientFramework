// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { DocumentFields } from './DocumentFields';
import { INVOICE_TYPE } from './erp.mocks';
import { fieldsOf, formValuesOf } from './schemaFields';

const FIELDS = fieldsOf(INVOICE_TYPE.write_schema ?? {});

const meta: Meta<typeof DocumentFields> = {
  title: 'erp/DocumentFields',
  component: DocumentFields,
  parameters: { layout: 'centered' },
  argTypes: { onChange: { action: 'changed' } },
};
export default meta;

type Story = StoryObj<typeof DocumentFields>;

export const InvoiceWithItems: Story = {
  args: {
    fields: FIELDS,
    values: formValuesOf(FIELDS, {
      customer: 'Acme Ltd',
      due_date: '2026-10-31',
      items: [
        { name: 'row-1', item_code: 'WIDGET', qty: 2, rate: 10.5 },
        { name: 'row-2', item_code: 'GADGET', qty: 1, rate: 99 },
      ],
    }),
  },
};

export const NewInvoice: Story = { args: { fields: FIELDS, values: formValuesOf(FIELDS, {}) } };
