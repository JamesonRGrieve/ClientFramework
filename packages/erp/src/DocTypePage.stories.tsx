// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { DocTypePage } from './DocTypePage';
import { erpHandlers, NAMESPACE } from './erp.mocks';

const meta: Meta<typeof DocTypePage> = {
  title: 'erp/DocTypePage',
  component: DocTypePage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: erpHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof DocTypePage>;

export const SalesInvoices: Story = { args: { params: { namespace: NAMESPACE, slug: 'sales_invoice' } } };

export const NotUsable: Story = { args: { params: { namespace: NAMESPACE, slug: 'gone' } } };
