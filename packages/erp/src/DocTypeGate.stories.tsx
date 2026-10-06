// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { DocTypeGate } from './DocTypeGate';
import { erpHandlers, NAMESPACE } from './erp.mocks';

const meta: Meta<typeof DocTypeGate> = {
  title: 'erp/DocTypeGate',
  component: DocTypeGate,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: erpHandlers() } },
  decorators: [withZephyrexApi],
  args: { children: (docType) => `The ${docType.name} page goes here.` },
};
export default meta;

type Story = StoryObj<typeof DocTypeGate>;

export const Customer: Story = { args: { params: { namespace: NAMESPACE, slug: 'customer' } } };

export const NotUsable: Story = { args: { params: { namespace: NAMESPACE, slug: 'gone' } } };
