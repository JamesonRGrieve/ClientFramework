// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withAuthentication } from './authentication.mocks';
import { PairApprove } from './PairApprove';

// Opened without a `?token=`, the page explains the link is incomplete.
const meta: Meta<typeof PairApprove> = {
  title: 'auth-device-pairing/PairApprove',
  component: PairApprove,
  parameters: { layout: 'centered', nextjs: { appDirectory: true } },
  decorators: [withAuthentication],
};
export default meta;

type Story = StoryObj<typeof PairApprove>;

export const WithoutToken: Story = {};
