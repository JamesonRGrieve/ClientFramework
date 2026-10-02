// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Meta, StoryObj } from '@storybook/nextjs';
import { withAuthentication } from './authentication.mocks';
import { PairRequest } from './PairRequest';

// With no API to answer, the page makes no code and offers to start again.
const meta: Meta<typeof PairRequest> = {
  title: 'auth-device-pairing/PairRequest',
  component: PairRequest,
  parameters: { layout: 'centered', nextjs: { appDirectory: true } },
  decorators: [withAuthentication],
};
export default meta;

type Story = StoryObj<typeof PairRequest>;

export const WithoutServer: Story = {};
