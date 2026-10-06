// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withZephyrexApi } from 'zephyrex/testing';
import { erpFixture, erpHandlers } from './erp.mocks';
import { ErpPage } from './ErpPage';

const meta: Meta<typeof ErpPage> = {
  title: 'erp/ErpPage',
  component: ErpPage,
  parameters: { nextjs: { appDirectory: true }, layout: 'fullscreen', msw: { handlers: erpHandlers() } },
  decorators: [withZephyrexApi],
};
export default meta;

type Story = StoryObj<typeof ErpPage>;

export const OneSite: Story = {};

export const NoSite: Story = { parameters: { msw: { handlers: erpHandlers({ ...erpFixture(), docTypes: [] }) } } };
