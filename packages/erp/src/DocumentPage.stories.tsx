// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { DocumentPage } from './DocumentPage';
import { erpHandlers, INVOICE, NAMESPACE } from './erp.mocks';

const meta: Meta<typeof DocumentPage> = {
  title: 'erp/DocumentPage',
  component: DocumentPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: erpHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof DocumentPage>;

export const DraftInvoice: Story = { args: { params: { namespace: NAMESPACE, slug: 'sales_invoice', name: INVOICE } } };

export const SubmittedInvoice: Story = {
  args: { params: { namespace: NAMESPACE, slug: 'sales_invoice', name: 'ACC-SINV-0002' } },
};
